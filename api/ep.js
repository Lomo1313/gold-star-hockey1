// api/ep.js — Vercel serverless function
// Proxies all EliteProspects API requests to avoid CORS issues.
// The function forwards any path + query string to api.eliteprospects.com/v1,
// adding the API key from an environment variable (EP_API_KEY) if one is set,
// and always returns the correct CORS headers.

const EP_BASE = "https://api.eliteprospects.com/v1";

exports.handler = async function (event) {
  // Path after /.netlify/functions/ep — e.g. "/players" or "/players/123/stats"
  const epPath = event.path.replace(/^\/?\.netlify\/functions\/ep/, "").replace(/^\/api\/ep/, "") || "/";

  // Forward query params as-is; inject EP_API_KEY if set server-side
  const params = new URLSearchParams(event.queryStringParameters || {});

  // If you store your EP API key as an environment variable, it will be injected here
  // so you never have to expose it in the browser.
  if (process.env.EP_API_KEY && !params.has("apiKey")) {
    params.set("apiKey", process.env.EP_API_KEY);
  }

  const upstreamUrl = `${EP_BASE}${epPath}?${params.toString()}`;

  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle pre-flight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const resp = await fetch(upstreamUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const body = await resp.text();

    return {
      statusCode: resp.status,
      headers: {
        ...CORS,
        "Content-Type": resp.headers.get("content-type") || "application/json",
        "Cache-Control": "public, s-maxage=300", // cache 5 min on CDN edge
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Proxy error", detail: err.message }),
    };
  }
};
