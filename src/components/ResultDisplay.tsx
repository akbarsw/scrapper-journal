"use client";

interface Props {
  status: "idle" | "pending" | "running" | "done" | "failed";
  result: any;
  error: string | null;
  jobId: string | null;
}

export default function ResultDisplay({ status, result, error, jobId }: Props) {
  if (status !== "done" && status !== "failed") return null;

  if (status === "failed") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium text-lg">❌ Gagal</p>
        <p className="text-red-500 text-sm mt-1">{error || "Unknown error"}</p>
      </div>
    );
  }

  const count = result?.count || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-green-700 font-semibold text-lg flex items-center gap-2">
            ✅ Selesai!
          </h3>
          <p className="text-zinc-600 text-sm mt-1">
            Ditemukan <strong>{count}</strong> artikel
          </p>
        </div>
        <a
          href={`https://scrap-api.ryznrouter.dev/result_${jobId}.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          📄 Lihat Hasil
        </a>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">OpenAlex ✓</span>
        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">Semantic Scholar ✓</span>
        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">Scopus ✓</span>
        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">Crossref ✓</span>
        <span className="bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full">Filtered ✓</span>
      </div>
      <p className="text-xs text-zinc-400">Job ID: {jobId}</p>
    </div>
  );
}
