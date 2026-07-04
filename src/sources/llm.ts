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
    messages: [
      {
        role: "system",
        content: `You are an academic research assistant translating Indonesian thesis variables into optimal Boolean search queries for academic databases like Scopus and OpenAlex.
Task: Given a research topic or variables in Indonesian, return a concise boolean query containing English synonyms and the core Indonesian terms.
Rules:
1. Remove filler words (pengaruh, analisis, terhadap, studi kasus, di, dll).
2. Translate the core concepts to English.
3. Keep the Indonesian core concept as an OR condition if it's uniquely local.
4. Output ONLY the boolean query, nothing else. No markdown, no explanations.
Example input: analisis faktor-faktor yang mempengaruhi volume penjualan susu sapi perah di kud mojosongo
Example output: ("sales volume" OR "revenue") AND ("dairy cow" OR "milk production" OR "susu sapi perah")
Example input: Kinerja rantai pasok kopi
Example output: ("supply chain performance" OR "supply chain") AND ("coffee" OR "kopi")`
      },
      {
        role: "user",
        content: query
      }
    ],
    max_tokens: 50,
    temperature: 0.1
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 detik maksimal nunggu LLM

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
      const data = await res.json();
      const llmResult = data.choices?.[0]?.message?.content?.trim();
      if (llmResult) return llmResult;
    } else {
      console.error(`LLM Error: ${res.status}`);
    }
  } catch (e) {
    console.error("LLM Timeout or Error:", e);
  }

  // Fallback ke query asli yang dibersihkan stop-words nya jika LLM gagal
  const cleanedQuery = query
    .replace(/(?:^|\s)(pengaruh|analisis|dan|atau|terhadap|untuk|pada|di|dalam|studi|kasus|faktor|mempengaruhi)(?=\s|$)/gi, " ")
    .replace(/[,_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleanedQuery;
}
