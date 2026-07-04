export async function generateKeywords(query: string): Promise<string> {
  const routerUrl = "https://api.ryznrouter.dev/v1/chat/completions";
  const apiKey = process.env.ROUTER_API_KEY;

  // Jika API key tidak ada, kembalikan query asli
  if (!apiKey) {
    console.warn("ROUTER_API_KEY is not set. Using original query.");
    return query;
  }

    const payload = {
    model: "ag/gemini-3.1-pro-low",
    stream: false,
    messages: [
      {
        role: "system",
        content: `You are an academic keyword extractor.
Task: Given a research topic in Indonesian, extract the 2-3 most important core variables and translate them to English.
Rules:
1. Output ONLY a comma-separated list of English terms. No explanations, no boolean operators (like AND/OR), no brackets.
2. Remove filler words (pengaruh, analisis, terhadap).
Example input: analisis faktor-faktor yang mempengaruhi volume penjualan susu sapi perah
Example output: sales volume, dairy cow
Example input: Kinerja rantai pasok kopi
Example output: supply chain performance, coffee`
      },
      {
        role: "user",
        content: query
      }
    ],
    max_tokens: 150,
    temperature: 0.1
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(routerUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      let llmResult = "";
      
      try {
        const data = JSON.parse(text);
        llmResult = data.choices?.[0]?.message?.content?.trim();
      } catch (err) {
         const chunks = text.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'));
         for (const chunk of chunks) {
            try {
               const parsed = JSON.parse(chunk.replace('data: ', ''));
               const token = parsed.choices?.[0]?.delta?.content || "";
               llmResult += token;
            } catch (e) {}
         }
      }
      
      llmResult = llmResult.replace(/\n/g, '').replace(/["()]/g, '').trim();
      
      // Jika LLM keputus (cuma 1 kata, atau panjang karakter terlalu pendek untuk sebuah penelitian)
      if (!llmResult || llmResult.length < 5 || (llmResult.split(',').length < 2 && llmResult.length < 15)) {
        throw new Error("LLM balikin data kepotong/cacat");
      }

      if (llmResult && llmResult.includes(',')) {
         const terms = llmResult.split(',').map(t => t.trim()).filter(t => t);
         // Kita rakit Boolean.
         // Tapi TUNGGU! Kita harus nyelipin keyword Bahasa Indonesia aslinya biar jurnal lokal tetep dapet.
         const cleanIdQuery = query.replace(/(?:^|\s)(pengaruh|analisis|dan|atau|terhadap|untuk|pada|di|dalam|studi|kasus|faktor|mempengaruhi)(?=\s|$)/gi, " ").replace(/\s+/g, " ").trim();
         
         const booleanQuery = terms.map(t => `"${t}"`).join(' AND ');
         
         // Format Akhir: (Inggris AND Inggris) OR (Indonesia)
         return `(${booleanQuery}) OR ("${cleanIdQuery}")`;
      }
      if (llmResult) return `("${llmResult}") OR ("${query}")`;
    } else {
      console.error(`LLM Error: ${res.status}`);
    }
  } catch (e) {
    console.error("LLM Timeout or Error:", e);
  }

  // Fallback Murni (Pake Judul Indo aslinya aja)
  const cleanedQuery = query
    .replace(/(?:^|\s)(pengaruh|analisis|dan|atau|terhadap|untuk|pada|di|dalam|studi|kasus|faktor|mempengaruhi|kabupaten|kota|provinsi)(?=\s|$)/gi, " ")
    .replace(/[,_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleanedQuery;
}
