import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const key = process.env.SCOPUS_API_KEY || "not-set";

  const url =
    "https://api.elsevier.com/content/search/scopus?query=TITLE-ABS-KEY(%22store%20atmosphere%22)&count=3";

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "X-ELS-APIKey": key,
        Accept: "application/json",
      },
    });
    const body = await res.text();
    return Response.json({
      status: res.status,
      hasKey: key !== "not-set",
      keys: key.length,
      preview: key.slice(0, 6) + "...",
      body: body.slice(0, 500),
    });
  } catch (err: any) {
    return Response.json({
      error: err.name + ": " + err.message,
      hasKey: key !== "not-set",
    });
  }
}
