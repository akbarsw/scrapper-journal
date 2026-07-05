import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Dna, Activity, Copy, Check, Scissors, FileText, Trash2, ArrowRightLeft, ShieldAlert } from 'lucide-react';

const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R'
};

const ENZYMES = [
  { name: 'EcoRI', sequence: 'GAATTC', cutOffset: 1 },
  { name: 'BamHI', sequence: 'GGATCC', cutOffset: 1 },
  { name: 'HindIII', sequence: 'AAGCTT', cutOffset: 1 },
  { name: 'XbaI', sequence: 'TCTAGA', cutOffset: 1 },
  { name: 'NotI', sequence: 'GCGGCCGC', cutOffset: 2 },
  { name: 'HhaI', sequence: 'GCGC', cutOffset: 2 },
  { name: 'TaqI', sequence: 'TCGA', cutOffset: 1 }
];

export default function BioAnalyzer() {
  const { analyzerSequenceName, analyzerSequenceData, setAnalyzerSequence, saveToolHistory } = useAppStore();
  const [seqName, setSeqName] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [seqType, setSeqType] = useState<'DNA' | 'RNA' | 'Protein' | 'Unknown'>('Unknown');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Results
  const [cleanSeq, setCleanSeq] = useState('');
  const [gcContent, setGcContent] = useState(0);
  const [molecularWeight, setMolecularWeight] = useState(0);
  const [isoelectricPoint, setIsoelectricPoint] = useState<number | null>(null);
  const [transcribed, setTranscribed] = useState('');
  const [complemented, setComplemented] = useState('');
  const [revComplemented, setRevComplemented] = useState('');
  const [translated, setTranslated] = useState('');
  const [cuts, setCuts] = useState<{ name: string; position: number }[]>([]);
  const [aminoAcidFreq, setAminoAcidFreq] = useState<{ aa: string; count: number; pct: number }[]>([]);

  // Watch for sequence loads from history
  useEffect(() => {
    if (analyzerSequenceData) {
      setSeqName(analyzerSequenceName);
      setRawInput(analyzerSequenceData);
      setAnalyzerSequence('', ''); // Clear so edit/analyze works normally
    }
  }, [analyzerSequenceName, analyzerSequenceData, setAnalyzerSequence]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Autodetect & clean sequence on changes
  useEffect(() => {
    // Strip headers, whitespaces, numbers
    let cleaned = rawInput.replace(/>.*\n/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    setCleanSeq(cleaned);

    if (!cleaned) {
      setSeqType('Unknown');
      return;
    }

    // Simple heuristic
    const counts = { A: 0, T: 0, C: 0, G: 0, U: 0, others: 0 };
    for (let char of cleaned) {
      if (char === 'A') counts.A++;
      else if (char === 'T') counts.T++;
      else if (char === 'C') counts.C++;
      else if (char === 'G') counts.G++;
      else if (char === 'U') counts.U++;
      else counts.others++;
    }

    const total = cleaned.length;
    const ntRatio = (counts.A + counts.T + counts.C + counts.G + counts.U) / total;

    if (ntRatio > 0.85) {
      if (counts.U > 0 && counts.T === 0) {
        setSeqType('RNA');
      } else {
        setSeqType('DNA');
      }
    } else {
      setSeqType('Protein');
    }
  }, [rawInput]);

  const loadSample = (type: 'DNA' | 'RNA' | 'Protein') => {
    if (type === 'DNA') {
      setSeqName('Sample Plasmid pUC19 Fragment');
      setRawInput('GACGAAAGGGCCTCGTGATACGCCTATTTTTATAGGTTAATGTCATGATAATAATGGTTTCTTAGACGTCAGGTGGCACTTTTCGGGGAAATGTGCGCGGAACCCCTATTTGTTTATTTTTCTAAATACATTCAAATATGTATCCGCTCATGAGACAATAACCCTGATAAATGCTTCAATAATATTGAAAAAGGAAGAGTATGAGTATTCAACATTTCCGTGTCGCCCTTATTCCCTTTTTTGCGGCATTTTGCCTTCCTGTTTTTGCTCACCCAGAAACGCTGGTGAAAGTAAAAGATGCTGAAGATCAGTTGGGTGCACGAGTGGGTTACATCGAAC');
    } else if (type === 'RNA') {
      setSeqName('Sample SARS-CoV-2 Spike mRNA segment');
      setRawInput('AUGUUUGUUUUUCUUGUUUUAUUGCCACUAGUCUCUAGUCAGUGUGUUAAUCUUACAACCAGAACUCAAUUACCCCCUGCAUACACUAAUUCUUUCACACGUGGUGUUUAUUACCCUGACAAAGUUUUCAGAUCUUCAGUUUAUCAUCACACUCAACCAACACCAUGAUGGUGUUUUACCUGUAUAGAUUGUUUAGAU');
    } else {
      setSeqName('Sample Human Insulin Precursor');
      setRawInput('MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN');
    }
  };

  const handleAnalyze = () => {
    if (!cleanSeq) return;

    // 1. Calculate GC / AT Content
    if (seqType === 'DNA' || seqType === 'RNA') {
      const gOrC = cleanSeq.split('').filter(c => c === 'G' || c === 'C').length;
      setGcContent((gOrC / cleanSeq.length) * 100);

      // Molecular Weight (approx: 329.2g/mol for DNA nt, 339.2g/mol for RNA nt)
      const weightPerBase = seqType === 'DNA' ? 329.2 : 339.2;
      setMolecularWeight(cleanSeq.length * weightPerBase + 15.9); // approximate
    } else {
      // Protein Molecular Weight (average 110 Da per amino acid)
      setMolecularWeight(cleanSeq.length * 110);
    }

    // 2. Transcription, Complement & Reverse Complement
    if (seqType === 'DNA') {
      // Transcription: T -> U
      setTranscribed(cleanSeq.replace(/T/g, 'U'));
      // Complement: A-T, G-C
      const comp = cleanSeq.split('').map(c => {
        if (c === 'A') return 'T';
        if (c === 'T') return 'A';
        if (c === 'G') return 'C';
        if (c === 'C') return 'G';
        return c;
      }).join('');
      setComplemented(comp);
      setRevComplemented(comp.split('').reverse().join(''));
    } else if (seqType === 'RNA') {
      // Reverse Transcription: U -> T
      setTranscribed(cleanSeq.replace(/U/g, 'T'));
      const comp = cleanSeq.split('').map(c => {
        if (c === 'A') return 'U';
        if (c === 'U') return 'A';
        if (c === 'G') return 'C';
        if (c === 'C') return 'G';
        return c;
      }).join('');
      setComplemented(comp);
      setRevComplemented(comp.split('').reverse().join(''));
    }

    // 3. Translation (DNA/RNA -> Protein)
    if (seqType === 'DNA' || seqType === 'RNA') {
      const template = seqType === 'DNA' ? cleanSeq : cleanSeq.replace(/U/g, 'T');
      let prot = '';
      for (let i = 0; i < template.length - 2; i += 3) {
        const codon = template.substring(i, i + 3);
        prot += CODON_TABLE[codon] || '?';
      }
      setTranslated(prot);
    }

    // 4. Restriction Enzyme Digest (DNA only)
    if (seqType === 'DNA') {
      const foundCuts: { name: string; position: number }[] = [];
      ENZYMES.forEach(enz => {
        let index = cleanSeq.indexOf(enz.sequence);
        while (index !== -1) {
          foundCuts.push({
            name: enz.name,
            position: index + 1 + enz.cutOffset
          });
          index = cleanSeq.indexOf(enz.sequence, index + 1);
        }
      });
      setCuts(foundCuts.sort((a, b) => a.position - b.position));
    } else {
      setCuts([]);
    }

    // 5. Protein Amino Acid Frequencies & Isoelectric Point (approx)
    if (seqType === 'Protein') {
      const counts: Record<string, number> = {};
      cleanSeq.split('').forEach(aa => {
        counts[aa] = (counts[aa] || 0) + 1;
      });

      const freqs = Object.entries(counts).map(([aa, count]) => ({
        aa,
        count,
        pct: (count / cleanSeq.length) * 100
      })).sort((a, b) => b.count - a.count);
      setAminoAcidFreq(freqs);

      // Simple isoelectric point estimation
      // Acidic (D,E) vs Basic (K,R,H) count
      const acidic = (counts['D'] || 0) + (counts['E'] || 0);
      const basic = (counts['K'] || 0) + (counts['R'] || 0) + (counts['H'] || 0);
      let pI = 7.0;
      if (acidic > basic) pI = 7.0 - (acidic - basic) * 0.3;
      else pI = 7.0 + (basic - acidic) * 0.3;
      setIsoelectricPoint(Math.max(2.0, Math.min(12.0, pI)));
    } else {
      setAminoAcidFreq([]);
      setIsoelectricPoint(null);
    }

    // Save to history
    saveToolHistory(seqName || "Quick Sequence", cleanSeq, seqType, cleanSeq.length);
  };

  const handleReset = () => {
    setSeqName('');
    setRawInput('');
    setCleanSeq('');
    setTranscribed('');
    setComplemented('');
    setRevComplemented('');
    setTranslated('');
    setGcContent(0);
    setMolecularWeight(0);
    setCuts([]);
    setAminoAcidFreq([]);
    setIsoelectricPoint(null);
  };

  return (
    <div className="w-full pt-10 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
          <Dna className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">DNA/RNA/Protein Analyzer</h1>
          <p className="text-sm text-gray-500">Analisis sekuens biologis molekuler, transkripsi, translasi, dan pemotongan restriksi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Sequence Input & Settings */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nama Sekuens</label>
            <input
              type="text"
              value={seqName}
              onChange={(e) => setSeqName(e.target.value)}
              placeholder="e.g. Gen Target Insulin"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Input Sekuens (Raw/FASTA)</label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste raw sequence (ATGC/AUGC...) or FASTA format here..."
              rows={8}
              className="w-full p-3 font-mono text-xs border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-gray-800"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Tipe Terdeteksi: 
              <span className={`ml-1.5 font-bold px-2 py-0.5 rounded ${
                seqType === 'DNA' ? 'bg-blue-50 text-blue-600' :
                seqType === 'RNA' ? 'bg-orange-50 text-orange-600' :
                seqType === 'Protein' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}>{seqType}</span>
            </span>
            {cleanSeq && (
              <span>Length: <strong className="text-gray-700">{cleanSeq.length} bp/aa</strong></span>
            )}
          </div>

          {/* Sample Loader */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-medium block">Load contoh sekuens:</span>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => loadSample('DNA')} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs transition-colors">DNA</button>
              <button onClick={() => loadSample('RNA')} className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-xs transition-colors">RNA</button>
              <button onClick={() => loadSample('Protein')} className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs transition-colors">Protein</button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAnalyze}
              disabled={!cleanSeq}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" /> Analisis Sekuens
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg transition-colors"
              title="Reset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {!cleanSeq ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-16 text-center text-gray-400 space-y-3">
              <Dna className="w-12 h-12 mx-auto stroke-1" />
              <p className="font-medium">Masukkan atau paste sekuens di sebelah kiri untuk memulai analisis</p>
            </div>
          ) : (
            <>
              {/* Card: Basic Stats */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" /> Hasil Analisis Dasar
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-400 block mb-0.5">Tipe Sekuens</span>
                    <span className="text-lg font-bold text-gray-800">{seqType}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-400 block mb-0.5">Panjang</span>
                    <span className="text-lg font-bold text-gray-800">{cleanSeq.length} {seqType === 'Protein' ? 'aa' : 'bp'}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-400 block mb-0.5">Berat Molekul (MW)</span>
                    <span className="text-lg font-bold text-gray-800">
                      {molecularWeight > 1000 ? `${(molecularWeight / 1000).toFixed(2)} kDa` : `${molecularWeight.toFixed(1)} Da`}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    {seqType !== 'Protein' ? (
                      <>
                        <span className="text-xs text-gray-400 block mb-0.5">Kandungan GC</span>
                        <span className="text-lg font-bold text-gray-800">{gcContent.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-400 block mb-0.5">Isoelectric Point (pI)</span>
                        <span className="text-lg font-bold text-gray-800">{isoelectricPoint ? isoelectricPoint.toFixed(2) : 'N/A'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Conditional Panels based on type */}
              {(seqType === 'DNA' || seqType === 'RNA') && (
                <>
                  {/* Card: Central Dogma (Transcription / Translation) */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Sintesis &amp; Rantai Komplemen
                    </h3>
                    
                    {/* Transcription */}
                    {transcribed && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">{seqType === 'DNA' ? 'Hasil Transkripsi (mRNA)' : 'Hasil Reverse Transcription (cDNA)'}</span>
                          <button onClick={() => handleCopy(transcribed, 'trans')} className="text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1 text-xs">
                            {copiedText === 'trans' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-800 break-all select-all border border-gray-100 max-h-24 overflow-y-auto">
                          {transcribed}
                        </div>
                      </div>
                    )}

                    {/* Complement */}
                    {complemented && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">Rantai Komplemen (3' - 5')</span>
                          <button onClick={() => handleCopy(complemented, 'comp')} className="text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1 text-xs">
                            {copiedText === 'comp' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-800 break-all select-all border border-gray-100 max-h-24 overflow-y-auto">
                          {complemented}
                        </div>
                      </div>
                    )}

                    {/* Reverse Complement */}
                    {revComplemented && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">Rantai Reverse Complement (5' - 3')</span>
                          <button onClick={() => handleCopy(revComplemented, 'revcomp')} className="text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1 text-xs">
                            {copiedText === 'revcomp' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-800 break-all select-all border border-gray-100 max-h-24 overflow-y-auto">
                          {revComplemented}
                        </div>
                      </div>
                    )}

                    {/* Translation */}
                    {translated && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">Translasi Protein (Asam Amino)</span>
                          <button onClick={() => handleCopy(translated, 'trans_prot')} className="text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1 text-xs">
                            {copiedText === 'trans_prot' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-800 break-all select-all border border-gray-100 max-h-32 overflow-y-auto leading-relaxed">
                          {translated.split('').map((aa, idx) => (
                            <span 
                              key={idx} 
                              className={
                                aa === 'M' ? 'bg-green-100 text-green-800 font-bold px-0.5 rounded' : 
                                aa === '*' ? 'bg-red-100 text-red-800 font-bold px-0.5 rounded' : ''
                              }
                              title={aa === 'M' ? 'Start Codon (Methionine)' : aa === '*' ? 'Stop Codon' : undefined}
                            >
                              {aa}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-4 text-[10.5px] text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-200 border border-green-300 rounded inline-block"></span> Start Codon (M)</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-200 border border-red-300 rounded inline-block"></span> Stop Codon (*)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card: Restriction Enzymes (DNA Only) */}
                  {seqType === 'DNA' && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-teal-600" /> Pemotongan Enzim Restriksi
                      </h3>
                      {cuts.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Tidak ditemukan situs pemotongan enzim standar (EcoRI, BamHI, HindIII, XbaI, NotI, HhaI, TaqI) di sekuens ini.</p>
                      ) : (
                        <div className="space-y-4">
                          {/* Visual Map of Cuts */}
                          <div className="relative pt-6 pb-2 px-1 bg-gray-50 rounded-xl border border-gray-100">
                            {/* DNA line */}
                            <div className="h-1.5 bg-teal-200 rounded-full w-full relative">
                              {cuts.map((cut, idx) => {
                                const posPercent = (cut.position / cleanSeq.length) * 100;
                                return (
                                  <div 
                                    key={idx} 
                                    className="absolute group flex flex-col items-center" 
                                    style={{ left: `${posPercent}%`, transform: 'translateX(-50%)', top: '-12px' }}
                                  >
                                    <div className="h-5 w-0.5 bg-red-500 group-hover:h-6 transition-all" />
                                    <span className="absolute -top-5 text-[8.5px] font-bold text-red-600 bg-white px-1 border border-red-200 rounded shadow-sm opacity-80 group-hover:opacity-100 group-hover:-top-6 transition-all whitespace-nowrap">
                                      {cut.name} ({cut.position} bp)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-3 px-1">
                              <span>1 bp</span>
                              <span>{cleanSeq.length} bp</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {cuts.map((cut, idx) => (
                              <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs flex justify-between items-center">
                                <span className="font-bold text-gray-800">{cut.name}</span>
                                <span className="text-gray-500 font-mono">Pos: {cut.position} bp</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Card: Proteomics (Protein only) */}
              {seqType === 'Protein' && aminoAcidFreq.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" /> Komposisi Asam Amino
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aminoAcidFreq.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-700">Asam Amino "{item.aa}"</span>
                          <span className="text-gray-500">{item.count} ({item.pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full" 
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
