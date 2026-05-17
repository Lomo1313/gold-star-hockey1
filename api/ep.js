export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const path = req.url.replace(/^\/api\/ep/, "");
  const url = `https://api.eliteprospects.com/v1${path}`;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.status(r.status).send(body);
  } catch(e) {
    res.status(502).json({ error: e.message });
  }
}

