export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">📚 ScrapJurnal</h1>
        <p className="text-lg text-blue-100 max-w-xl mx-auto">
          Scraping jurnal akademik dari OpenAlex, Semantic Scholar, Scopus &amp; Crossref.
          <br />Gratis, cepat, tinggal input variabel penelitian.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-blue-200 mt-3">
          <span className="bg-white/10 px-2.5 py-0.5 rounded-full">OpenAlex</span>
          <span className="bg-white/10 px-2.5 py-0.5 rounded-full">Semantic Scholar</span>
          <span className="bg-white/10 px-2.5 py-0.5 rounded-full">Scopus</span>
          <span className="bg-white/10 px-2.5 py-0.5 rounded-full">Crossref</span>
        </div>
      </div>
    </header>
  );
}
