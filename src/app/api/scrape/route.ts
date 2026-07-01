import { searchAll } from "@/sources/engine";
import type { SearchParams } from "@/sources/engine";
import { addHistory } from "@/app/api/history/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const params: SearchParams = {
      vars: body.vars || "",
      yearFrom: body.yearFrom || body.year || undefined,
      yearTo: body.yearTo || undefined,
      minCited: body.min_cited ?? body.minCited ?? 0,
      limit: body.limit || 20,
      lang: body.lang || "both",
      exclude: body.exclude || undefined,
      scopus: body.scopus ?? true,
    };

    if (!params.vars.trim()) {
      return Response.json({ error: "Variabel penelitian wajib diisi" }, { status: 400 });
    }

    const result = await searchAll(params);

    // Save history
    addHistory({
      id: Math.random().toString(36).slice(2, 10),
      vars: params.vars,
      total: result.total,
      status: "done",
      created: new Date().toISOString(),
    });

    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
