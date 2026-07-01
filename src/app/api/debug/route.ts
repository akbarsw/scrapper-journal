export async function GET() {
  const key = process.env.SCOPUS_API_KEY || "not-set";
  const query = 'store atmosphere';
  
  // Replicate EXACTLY what scopus.ts does
  let scopusQuery = `TITLE-ABS-KEY(${query.replace(/[^a-zA-Z0-9\s_]/g, " ").split(",").map(s => `"${s.trim()}"`).join(" OR ")})`;
  scopusQuery += ` AND PUBYEAR > 2023`;

  const params = new URLSearchParams({
    query: scopusQuery,
    count: "3",
    sort: "-citedby-count",
  });

  try {
    const res = await fetch(`https://api.elsevier.com/content/search/scopus?${params}`, {
      headers: {
        "X-ELS-APIKey": key,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    const body = await res.text();
    return Response.json({
      status: res.status,
      url: `https://api.elsevier.com/content/search/scopus?${params}`,
      body: body.slice(0, 300),
    });
  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}
