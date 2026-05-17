// api/ep.js — Vercel serverless function
// Proxies EliteProspects API requests to avoid CORS issues.

const EP_BASE = "https://api.eliteprospects.com/v1";

module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Vercel gives us req.url like "/api/ep/players/123/stats?apiKey=..."
  // Strip everything up to and including "/api/ep" to get the EP path
  const rawUrl = req.url || "";
  const afterEp = rawUrl.replace(/^.*\/api\/ep/, ""); // e.g. "/players?q=foo"
  const epPath = afterEp.split("?")[0] || "/players";  // e.g. "/players"

  // Rebuild query string from Vercel's already-parsed query object
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    params.append(k, v);
  }

  // Optionally inject server-side API key
  if (process.env.EP_API_KEY && !params.has("apiKey")) {
    params.set("apiKey", process.env.EP_API_KEY);
  }

  const upstreamUrl = `${EP_BASE}${epPath}?${params.toString()}`;

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const body = await response.text();
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    return res.status(response.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: "Proxy error", detail: err.message });
  }
};
