import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, LockOpen } from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ isOpen, onClose, onApply }) => {
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  
  const [yearType, setYearType] = useState('Past 5 yrs.');
  const [yearFrom, setYearFrom] = useState(new Date().getFullYear() - 5);
  const [yearTo, setYearTo] = useState(new Date().getFullYear());
  
  const [minCitations, setMinCitations] = useState<number | ''>('');
  const [openAccess, setOpenAccess] = useState(false);
  const [lang, setLang] = useState('both');
  const [limit, setLimit] = useState(10);

  // Sources selection
  const [useOpenAlex, setUseOpenAlex] = useState(true);
  const [useSemanticScholar, setUseSemanticScholar] = useState(true);
  const [useCrossref, setUseCrossref] = useState(true);
  const [useScopus, setUseScopus] = useState(true);

  if (!isOpen) return null;

  let activeFiltersCount = 0;
  if (yearType !== 'Any') activeFiltersCount++;
  if (minCitations !== '') activeFiltersCount++;
  if (openAccess) activeFiltersCount++;
  if (lang !== 'both') activeFiltersCount++;
  if (!useOpenAlex || !useSemanticScholar || !useScopus) activeFiltersCount++;

  const handleApply = () => {
    const selectedSources: string[] = [];
    if (useOpenAlex) selectedSources.push('openalex');
    if (useSemanticScholar) selectedSources.push('semanticscholar');
    if (useCrossref) selectedSources.push('crossref');
    if (useScopus) selectedSources.push('scopus');

    onApply({
      yearFrom: yearType === 'Any' ? undefined : yearFrom,
      yearTo: yearType === 'Any' ? undefined : yearTo,
      minCited: minCitations === '' ? 0 : minCitations,
      lang,
      limit,
      openAccess,
      sources: selectedSources
    });
    onClose();
  };

  const handleReset = () => {
    setYearType('Any');
    setMinCitations('');
    setOpenAccess(false);
    setLang('both');
    setLimit(10);
    setUseOpenAlex(true);
    setUseSemanticScholar(true);
    setUseCrossref(true);
    setUseScopus(true);
  };

  const uncheckedSourcesCount = 4 - (useOpenAlex ? 1 : 0) - (useSemanticScholar ? 1 : 0) - (useCrossref ? 1 : 0) - (useScopus ? 1 : 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[90] transition-opacity" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-[380px] bg-white z-[100] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200 font-sans">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-[17px] font-bold text-gray-900">Filter {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors border border-gray-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* General Section */}
          <div className="border-b border-gray-100">
            <button onClick={() => setGeneralExpanded(!generalExpanded)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="text-[15px] font-bold text-gray-900">General</span>
              <div className="flex items-center gap-3">
                 {activeFiltersCount - (uncheckedSourcesCount > 0 ? 1 : 0) > 0 && (
                   <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-bold flex items-center justify-center">
                     {activeFiltersCount - (uncheckedSourcesCount > 0 ? 1 : 0)}
                   </span>
                 )}
                 {generalExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {generalExpanded && (
              <div className="px-5 pb-5 space-y-6">
                
                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-gray-900">Publish year</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Any', 'Past 2 yrs.', 'Past 5 yrs.', 'Past 10 yrs.'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setYearType(type);
                          const currentYear = new Date().getFullYear();
                          if (type === 'Past 2 yrs.') { setYearFrom(currentYear - 2); setYearTo(currentYear); }
                          else if (type === 'Past 5 yrs.') { setYearFrom(currentYear - 5); setYearTo(currentYear); }
                          else if (type === 'Past 10 yrs.') { setYearFrom(currentYear - 10); setYearTo(currentYear); }
                        }}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                          yearType === type 
                          ? 'bg-teal-50 text-gray-900 border border-teal-200' 
                          : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {yearType !== 'Any' && (
                     <div className="flex items-center gap-3 pt-1">
                       <input type="number" value={yearFrom} onChange={e => setYearFrom(Number(e.target.value))} className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 font-medium" />
                       <span className="text-gray-400 font-bold">-</span>
                       <input type="number" value={yearTo} onChange={e => setYearTo(Number(e.target.value))} className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 font-medium" />
                     </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-gray-900">Citations</h3>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-400 text-sm">At least</span>
                    <input type="number" value={minCitations} onChange={e => setMinCitations(e.target.value ? Number(e.target.value) : '')} className="w-full h-10 pl-16 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 font-medium" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-gray-900">Language</h3>
                  <div className="relative">
                    <select value={lang} onChange={e => setLang(e.target.value)} className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 appearance-none bg-white font-medium cursor-pointer">
                      <option value="both">Any (Indonesian & English)</option>
                      <option value="id">Indonesian Only</option>
                      <option value="en">English Only</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-600 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-[13px] font-bold text-gray-900">Max Results</h3>
                  <div className="relative">
                    <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 appearance-none bg-white font-medium cursor-pointer">
                      <option value={10}>Top 10 Papers</option>
                      <option value={20}>Top 20 Papers</option>
                      <option value={50}>Top 50 Papers</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-600 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LockOpen className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                      <span className="text-[14px] font-bold text-gray-900">Open access</span>
                    </div>
                    <button onClick={() => setOpenAccess(!openAccess)} className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${openAccess ? 'bg-teal-600' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${openAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Sources Section */}
          <div className="border-b border-gray-100">
            <button onClick={() => setSourcesExpanded(!sourcesExpanded)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[15px] font-bold text-gray-900">Sources</span>
                <span className="text-[13px] text-gray-500">Publishers</span>
              </div>
              <div className="flex items-center gap-3">
                {uncheckedSourcesCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-bold flex items-center justify-center">
                    {uncheckedSourcesCount}
                  </span>
                )}
                {sourcesExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {sourcesExpanded && (
              <div className="px-5 pb-5 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[14px] text-gray-700 group-hover:text-gray-900 font-medium">OpenAlex</span>
                  <input 
                    type="checkbox" 
                    checked={useOpenAlex} 
                    onChange={(e) => setUseOpenAlex(e.target.checked)} 
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[14px] text-gray-700 group-hover:text-gray-900 font-medium">Semantic Scholar</span>
                  <input 
                    type="checkbox" 
                    checked={useSemanticScholar} 
                    onChange={(e) => setUseSemanticScholar(e.target.checked)} 
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[14px] text-gray-700 group-hover:text-gray-900 font-medium">Crossref</span>
                  <input 
                    type="checkbox" 
                    checked={useCrossref} 
                    onChange={(e) => setUseCrossref(e.target.checked)} 
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[14px] text-gray-700 group-hover:text-gray-900 font-medium">Scopus</span>
                  <input 
                    type="checkbox" 
                    checked={useScopus} 
                    onChange={(e) => setUseScopus(e.target.checked)} 
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

        </div>

        <div className="p-5 border-t border-gray-200 bg-white flex gap-3 shrink-0">
          <button onClick={handleApply} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[15px] h-12 rounded-xl transition-colors cursor-pointer">
            Apply {activeFiltersCount > 0 ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''}` : ''}
          </button>
          <button onClick={handleReset} className="px-6 border border-gray-300 hover:bg-gray-50 text-gray-900 font-bold text-[15px] h-12 rounded-xl transition-colors cursor-pointer">
            Reset
          </button>
        </div>

      </div>
    </>
  );
};
