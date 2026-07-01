export default function History({ refreshKey }: { refreshKey: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">📋 Riwayat Pencarian</h2>
        <button
          onClick={fetchHistory}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>
      <div id="history-list">
        <p className="text-sm text-zinc-400">Belum ada riwayat. Mulai scraping untuk melihat hasil.</p>
      </div>
    </div>
  );
}

async function fetchHistory() {
  const el = document.getElementById("history-list");
  if (!el) return;
  try {
    const res = await fetch("http://104.211.102.145:8080/api/history");
    const data = await res.json();
    const jobs = data.jobs || [];
    if (jobs.length === 0) {
      el.innerHTML = '<p class="text-sm text-zinc-400">Belum ada riwayat.</p>';
      return;
    }
    el.innerHTML = jobs
      .map(
        (j: any) =>
          `<div class="flex items-center justify-between py-2 border-b text-sm last:border-0">
            <span class="text-zinc-700">${j.created?.slice(0, 16) || "?"}</span>
            <span class="${j.status === "done" ? "text-green-600" : j.status === "failed" ? "text-red-500" : "text-zinc-400"}">${j.status}</span>
            <span class="text-zinc-400 font-mono text-xs">${j.id?.slice(0, 8)}</span>
          </div>`
      )
      .join("");
  } catch {
    el.innerHTML = '<p class="text-sm text-red-500">Gagal load riwayat</p>';
  }
}
