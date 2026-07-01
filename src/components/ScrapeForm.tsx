"use client";

import { useState, FormEvent } from "react";

interface Props {
  onSubmit: (data: Record<string, any>) => void;
  disabled: boolean;
}

export default function ScrapeForm({ onSubmit, disabled }: Props) {
  const [vars, setVars] = useState("");
  const [year, setYear] = useState(2020);
  const [minCited, setMinCited] = useState(3);
  const [limit, setLimit] = useState(40);
  const [lang, setLang] = useState("both");
  const [exclude, setExclude] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vars.trim()) return;
    onSubmit({
      vars: vars.trim(),
      year,
      min_cited: minCited,
      limit,
      lang,
      exclude: exclude.trim() || null,
      scopus: true,
      enrich: true,
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-5">🔍 Cari Artikel Jurnal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Variabel Penelitian</label>
          <input
            value={vars}
            onChange={(e) => setVars(e.target.value)}
            placeholder="store_atmosphere, perceived_value, customer_satisfaction"
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
          />
          <p className="text-xs text-zinc-400 mt-1">Pisahkan dengan koma. Contoh: store_atmosphere,perceived_value,kepuasan_konsumen</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Dari Tahun</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2026}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min. Sitasi</label>
            <input
              type="number"
              value={minCited}
              onChange={(e) => setMinCited(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Limit Paper</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={5}
              max={100}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bahasa</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm bg-white"
            >
              <option value="both">Indonesia &amp; Inggris</option>
              <option value="id">Indonesia saja</option>
              <option value="en">Inggris saja</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exclude <span className="text-zinc-400 font-normal">(opsional)</span></label>
            <input
              value={exclude}
              onChange={(e) => setExclude(e.target.value)}
              placeholder="covid, schizophrenia, education"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="scopus"
            defaultChecked
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="scopus" className="text-sm">Scopus <span className="text-xs text-zinc-400">(Q1-Q4)</span></label>
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white font-medium text-sm transition-colors"
        >
          {disabled ? "⏳ Memproses..." : "🔬 Mulai Scraping"}
        </button>
      </form>
    </div>
  );
}
