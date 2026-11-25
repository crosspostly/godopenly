// God Openly visit counter: Cloudflare Worker + D1. No cookies, no personal data.
// GET /hit?k=landing,landing-src-long  -> increments today's and total counters
// GET /stats                          -> {"total": {key: n}, "days": {"2026-11-25": {key: n}}}
const KEY_RE = /^[a-z0-9-]{1,60}$/;
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;
const CORS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/hit") {
      if (BOT_RE.test(req.headers.get("user-agent") || "")) return new Response("bot", { headers: CORS });
      const keys = [...new Set((url.searchParams.get("k") || "").split(","))].filter((k) => KEY_RE.test(k)).slice(0, 6);
      const day = new Date().toISOString().slice(0, 10);
      const stmt = env.DB.prepare(
        "INSERT INTO hits (key, day, n) VALUES (?1, ?2, 1) ON CONFLICT(key, day) DO UPDATE SET n = n + 1"
      );
      if (keys.length) await env.DB.batch(keys.flatMap((k) => [stmt.bind(k, day), stmt.bind(k, "total")]));
      return new Response("ok", { headers: CORS });
    }
    if (url.pathname === "/stats") {
      const { results } = await env.DB.prepare(
        "SELECT key, day, n FROM hits WHERE day = 'total' OR day >= date('now', '-14 days') ORDER BY day DESC"
      ).all();
      const out = { total: {}, days: {} };
      for (const r of results) {
        if (r.day === "total") out.total[r.key] = r.n;
        else (out.days[r.day] ||= {})[r.key] = r.n;
      }
      return Response.json(out, { headers: CORS });
    }
    return new Response("God Openly counter", { headers: CORS });
  },
};
