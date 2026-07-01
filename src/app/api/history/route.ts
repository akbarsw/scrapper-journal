const BACKEND = "http://104.211.102.145:8080";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/history`);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
