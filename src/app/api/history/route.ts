const BACKEND = "https://scrap-api.ryznrouter.dev";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/history`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
