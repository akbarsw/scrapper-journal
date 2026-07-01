export async function POST(request: Request) {
  const body = await request.json();
  const q = body.q || "store atmosphere";

  const API_KEY = process.env.OPENALEX_API_KEY || "";
  const EMAIL = process.env.OPENALEX_EMAIL || "apakahbenar@ryznrouter.dev";

  const params = new URLSearchParams({
    search: q,
    per_page: "3",
    sort: "cited_by_count:desc",
    mailto: EMAIL,
  });
  if (API_KEY) params.set("api_key", API_KEY);

  const url = `https://api.openalex.org/works?${params}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ScrapJurnal/1.0" },
    });
    const data = await res.json();

    return Response.json({
      status: res.status,
      hasKey: !!API_KEY,
      keyLen: API_KEY.length,
      url: url.replace(API_KEY, "***"),
      resultCount: data.meta?.count || data.results?.length || 0,
      firstTitle: data.results?.[0]?.title?.slice(0, 50) || null,
    });
  } catch (err: any) {
    return Response.json({ error: err.message, hasKey: !!API_KEY });
  }
}
