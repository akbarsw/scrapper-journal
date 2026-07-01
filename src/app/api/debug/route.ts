export async function POST() {
  const key = process.env.SCOPUS_API_KEY || "not-set";
  
  try {
    const res = await fetch(
      "https://api.elsevier.com/content/search/scopus?query=TITLE-ABS-KEY(%22store%20atmosphere%22)&count=3",
      {
        headers: {
          "X-ELS-APIKey": key,
          Accept: "application/json",
        },
      }
    );
    const text = await res.text();
    return Response.json({
      status: res.status,
      hasKey: key !== "not-set",
      keyLen: key.length,
      keyPreview: key.slice(0,6) + "...",
      body: text.slice(0, 200),
    });
  } catch (err: any) {
    return Response.json({ error: err.message, hasKey: key !== "not-set" });
  }
}
