const BACKEND = "https://scrap-api.ryznrouter.dev";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const res = await fetch(`${BACKEND}/api/status/${jobId}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
