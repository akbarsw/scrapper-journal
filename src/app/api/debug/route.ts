export async function GET() {
  const key = process.env.SCOPUS_API_KEY || "not-set";
  const query = 'TITLE-ABS-KEY("store atmosphere")';
  
  const results: any[] = [];

  // Test 1: direct fetch
  try {
    const r1 = await fetch(
      `https://api.elsevier.com/content/search/scopus?query=${encodeURIComponent(query)}&count=3`,
      {
        headers: {
          "X-ELS-APIKey": key,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    const t1 = await r1.text();
    results.push({ test: "direct", status: r1.status, body: t1.slice(0, 100) });
  } catch (e: any) {
    results.push({ test: "direct", error: e.message });
  }

  // Test 2: with URLSearchParams
  try {
    const params = new URLSearchParams({
      query: query,
      count: "3",
      sort: "-citedby-count",
      view: "COMPLETE",
    });
    const r2 = await fetch(`https://api.elsevier.com/content/search/scopus?${params}`, {
      headers: {
        "X-ELS-APIKey": key,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    const t2 = await r2.text();
    results.push({ test: "URLSearchParams", status: r2.status, body: t2.slice(0, 100) });
  } catch (e: any) {
    results.push({ test: "URLSearchParams", error: e.message });
  }

  return Response.json(results);
}
