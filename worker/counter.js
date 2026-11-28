// God Openly visit counter: Cloudflare Worker + D1. No cookies, no personal data.
// GET /hit?k=landing,landing-src-long  -> increments today's and total counters
// GET /stats                          -> {"total": {key: n}, "days": {"2026-11-25": {key: n}}}
// GET /go/<slug>                      -> 302 на партнёрскую ссылку + счётчик клика (go-<slug>)
const KEY_RE = /^[a-z0-9-]{1,60}$/;
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;
const CORS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };
// Партнёрские редиректы. Ссылки меняются здесь, а не в статьях и не в шапке профиля.
const LINKS = {
  halo: "https://gmm.one/2fc2981d-dec9-49e0-ab3b-87c487cb405d",
  praybefore: "", // появится после одобрения заявки
};

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
    if (url.pathname.startsWith("/go/")) {
      const slug = url.pathname.slice(4).replace(/[^a-z0-9-]/gi, "").slice(0, 40);
      const to = LINKS[slug];
      if (!to) return new Response("link not ready", { status: 404, headers: CORS });
      const day = new Date().toISOString().slice(0, 10);
      const stmt = env.DB.prepare(
        "INSERT INTO hits (key, day, n) VALUES (?1, ?2, 1) ON CONFLICT(key, day) DO UPDATE SET n = n + 1"
      );
      await env.DB.batch([stmt.bind(`go-${slug}`, day), stmt.bind(`go-${slug}`, "total")]);
      return new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store" } });
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