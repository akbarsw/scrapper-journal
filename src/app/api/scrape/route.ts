const BACKEND = "https://scrap-api.ryznrouter.dev";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/api/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // Add CORS headers
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
