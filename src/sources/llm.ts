export interface ExtractedIntent {
  query_english: string;
  query_indo: string;
  core_concepts: string[];
  enConcepts?: string[];
  idConcepts?: string[];
}

// 1. INTENT PARSER
export async function generateKeywords(query: string): Promise<ExtractedIntent> {
  const routerUrl = "https://api.ryznrouter.dev/v1/chat/completions";
  const apiKey = process.env.ROUTER_API_KEY;

  // Fallback function kalo LLM mati/limit
  const createFallback = (): ExtractedIntent => {
    const cleanIdQuery = query
      .replace(/(?:^|\s)(pengaruh|analisis|dan|atau|terhadap|untuk|pada|di|dalam|studi|kasus|faktor|mempengaruhi|kabupaten|kota|provinsi)(?=\s|$)/gi, " ")
      .replace(/[,_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    return {
      query_english: "",
      query_indo: cleanIdQuery,
      core_concepts: cleanIdQuery.split(" ").filter(w => w.length > 2),
      enConcepts: [],
      idConcepts: cleanIdQuery.split(" ").filter(w => w.length > 2)
    };
  };

  if (!apiKey) {
    console.warn("ROUTER_API_KEY is not set. Using fallback.");
    return createFallback();
  }

  const payload = {
    model: "ag/gemini-3.1-pro-low",
    stream: false,
    messages: [
      {
        role: "system",
        content: `You are an academic intent parser.
Given a research topic/query (in Indonesian or English), extract the core entities and concepts.
Respond ONLY with a valid minified JSON object exactly like this:
{"en":["english concept 1","english concept 2"],"id":["konsep indo 1","konsep indo 2"]}
Make sure concepts are SPECIFIC multi-word phrases (2-3 words), not generic single words.
Example Bad: ["kemitraan", "susu", "peternak"]
Example Good: ["kemitraan peternak sapi", "koperasi susu"]
Provide translation to the other language if applicable.
Do not use markdown, do not write explanations.`
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
        llmResult = data.choices?.[0]?.message?.content?.trim() || "";
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
      
      // Bersihin markdown kalau LLM bandel
      llmResult = llmResult.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsedJSON = JSON.parse(llmResult);
        if (parsedJSON.en && parsedJSON.id) {
          const en_str = parsedJSON.en.map((t: string) => `"${t}"`).join(" AND ");
          const id_str = parsedJSON.id.map((t: string) => `"${t}"`).join(" AND ");
          
          return {
            query_english: en_str,
            query_indo: parsedJSON.id.join(" "),
            core_concepts: [...parsedJSON.en, ...parsedJSON.id].map(s => s.toLowerCase()),
            enConcepts: parsedJSON.en,
            idConcepts: parsedJSON.id
          };
        }
      } catch (parseError) {
        throw new Error("Gagal parsing JSON dari LLM: " + llmResult);
      }
    }
  } catch (e) {
    console.error("LLM Timeout or Error:", e);
  }

  return createFallback();
}

// 2. SEMANTIC RERANKER (Membedakan "Makna" bukan cuma kata, menendang jurnal nyasar)
export async function rerankPapers(query: string, candidates: {id: string, title: string, abstract?: string}[]): Promise<string[]> {
  // Ambil maksimal 25 jurnal agar token tetap kecil dan Vercel tidak timeout
  const limitCandidates = candidates.slice(0, 25);
  if (limitCandidates.length === 0) return [];

  const routerUrl = "https://api.ryznrouter.dev/v1/chat/completions";
  const apiKey = process.env.ROUTER_API_KEY;

  if (!apiKey) return limitCandidates.map(c => c.id);

  const payload = {
    model: "ag/gemini-3.1-pro-low",
    messages: [
      {
        role: "system",
        content: `You are an expert academic evaluator. Your task is to select and rank research papers based on their STRICT semantic relevance to a user query.
Rules:
1. ONLY return a JSON array of the IDs of papers that are genuinely relevant to the query's specific topic.
2. Exclude any papers that are not relevant or only share a general theme but not the specific subject.
3. Order matters. Put the most relevant IDs first.
4. Output NOTHING else but the raw JSON array of strings (no markdown, no explanations).`
      },
      {
        role: "user",
        content: `Query/Topic: "${query}"\n\nCandidates:\n${limitCandidates.map(c => `ID: ${c.id}\nTitle: ${c.title}\nAbstract: ${c.abstract || "N/A"}`).join('\n\n')}`
      }
    ],
    temperature: 0.1,
    stream: false,
    max_tokens: 800
  };

  try {
    const res = await fetch(routerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return limitCandidates.map(c => c.id);

    const data = await res.json();
    const content = data.choices[0]?.message?.content?.trim() || "";
    
    // Anti-bodoh bersihin markdown JSON kalau AI bengal
    const cleanJson = content.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json/g, "").replace(/```/g, "").trim();
    
    let rankedIds: string[] = [];
    try {
      rankedIds = JSON.parse(cleanJson);
      if (!Array.isArray(rankedIds)) throw new Error("Not an array");
    } catch {
      return limitCandidates.map(c => c.id);
    }

    return rankedIds;
  } catch (err) {
    return limitCandidates.map(c => c.id);
  }
}
