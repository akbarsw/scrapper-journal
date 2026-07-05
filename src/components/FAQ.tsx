"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    id: "q1",
    question: "Apa itu Nemu Jurnal?",
    answer:
      "Nemu Jurnal adalah platform pencarian jurnal ilmiah yang menggabungkan beberapa sumber akademik sekaligus — OpenAlex, Semantic Scholar, dan Scopus — dalam satu pencarian. Hasilnya diurutkan berdasarkan relevansi menggunakan skor leksikal dan verifikasi AI.",
  },
  {
    id: "q2",
    question: "Dari mana sumber datanya?",
    answer:
      "Kami mengambil data dari tiga sumber utama: OpenAlex (lebih dari 250 juta karya ilmiah), Semantic Scholar (lebih dari 200 juta paper), dan Scopus (indeks jurnal peer-reviewed terkurasi). Semua pencarian dilakukan secara paralel agar hasil lebih lengkap.",
  },
  {
    id: "q3",
    question: "Apa itu badge 'AI Verified'?",
    answer:
      "Setelah hasil awal dikumpulkan, sistem kami mengirimkan 15 kandidat teratas ke model AI (Gemini) untuk dievaluasi ulang. Jurnal yang dinyatakan relevan secara semantik akan mendapat label 'AI Verified'. Ini membantu menyaring hasil yang hanya cocok secara kata kunci tapi tidak relevan secara topik.",
  },
  {
    id: "q4",
    question: "Apakah perlu login untuk mencari?",
    answer:
      "Tidak perlu login untuk melihat halaman utama. Namun, untuk mulai mencari dan menyimpan jurnal ke library, kamu perlu membuat akun terlebih dahulu. Pendaftaran gratis dan hanya butuh email.",
  },
  {
    id: "q5",
    question: "Bagaimana cara menyimpan jurnal yang menarik?",
    answer:
      "Setelah hasil pencarian muncul, klik ikon bookmark (🔖) di pojok kanan bawah setiap kartu jurnal. Jurnal yang disimpan bisa diakses kapan saja melalui menu 'My Library' di sidebar kiri.",
  },
  {
    id: "q6",
    question: "Apakah Nemu Jurnal mendukung bahasa Indonesia?",
    answer:
      "Ya. Sistem kami menggunakan strategi 'Double Shoot' — query kamu otomatis diterjemahkan dan dikirimkan dalam dua bahasa (Indonesia dan Inggris) secara bersamaan. Jadi hasil pencarian mencakup jurnal lokal maupun internasional.",
  },
];

export default function FAQ() {
  return (
    <div id="faq-section" className="w-full max-w-2xl mx-auto mt-36 pt-20 px-2">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Pertanyaan Umum</h2>
      <p className="text-sm text-gray-400 mb-6">Tentang cara kerja Nemu Jurnal</p>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="text-gray-800 text-sm font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
