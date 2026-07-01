"use client";

interface Props {
  data: {
    papers: any[];
    total: number;
    sources: { name: string; count: number; error?: string }[];
    time: number;
  };
}

export default function ResultDisplay({ data }: Props) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-green-700 font-semibold text-lg flex items-center gap-2">
              ✅ Ditemukan {data.total} artikel
            </h3>
            <p className="text-zinc-500 text-sm mt-1">{data.time / 1000}s — {data.papers.length} ditampilkan</p>
          </div>
        </div>
        {/* Source badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {data.sources.map((s) => (
            <span
              key={s.name}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                s.error
                  ? "bg-red-100 text-red-600"
                  : s.count > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {s.name} {s.error ? "✗" : `${s.count}✓`}
            </span>
          ))}
        </div>
      </div>

      {/* Paper list */}
      <div className="space-y-3">
        {data.papers.map((p: any, i: number) => (
          <div key={p.doi || i} className="bg-white rounded-xl shadow-sm border p-5 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h4 className="font-semibold text-zinc-900 leading-snug">{p.title}</h4>
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                p.source === "OpenAlex" ? "bg-blue-100 text-blue-700" :
                p.source === "SemanticScholar" ? "bg-purple-100 text-purple-700" :
                p.source === "Scopus" ? "bg-orange-100 text-orange-700" :
                "bg-zinc-100 text-zinc-700"
              }`}>
                {p.source}
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              {p.authors.slice(0, 3).join(", ")}{p.authors.length > 3 ? " et al." : ""}
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>📅 {p.year}</span>
              <span>📖 {p.journal || "N/A"}</span>
              <span>💬 {p.cited} sitasi</span>
            </div>
            <div className="flex items-center gap-3">
              {p.doi && (
                <a
                  href={`https://doi.org/${p.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  DOI ↗
                </a>
              )}
              {p.abstract && p.abstract !== "Abstract available" && (
                <details className="text-xs text-zinc-500">
                  <summary className="cursor-pointer hover:text-zinc-700">Abstrak</summary>
                  <p className="mt-2 text-zinc-600 leading-relaxed">{p.abstract}</p>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
