// ── Vercel Edge Function — Brave Search proxy ─────────────────────────────────
// Keeps the API key server-side. Returns { configured, web: { results } }.
// If BRAVE_API_KEY is not set, returns configured:false and empty results
// so the frontend degrades gracefully to direct-link mode.

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ error: "Query required" }), { status: 400, headers });
  }

  const apiKey = process.env.BRAVE_API_KEY;

  // No key configured — tell the frontend gracefully
  if (!apiKey) {
    return new Response(
      JSON.stringify({ configured: false, web: { results: [] } }),
      { headers }
    );
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", q);
    url.searchParams.set("count", "10");
    url.searchParams.set("country", "SA");
    url.searchParams.set("search_lang", "ar");

    const res = await fetch(url.toString(), {
      headers: {
        "X-Subscription-Token": apiKey,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ configured: true, error: "Search API error", web: { results: [] } }),
        { status: res.status, headers }
      );
    }

    const data = await res.json() as Record<string, unknown>;
    return new Response(JSON.stringify({ configured: true, ...data }), { headers });
  } catch {
    return new Response(
      JSON.stringify({ configured: true, error: "Network error", web: { results: [] } }),
      { status: 500, headers }
    );
  }
}
