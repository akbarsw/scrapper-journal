export interface ExtractedIntent {
  query_english: string;
  query_indo: string;
  core_concepts: string[];
}

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
      core_concepts: cleanIdQuery.split(" ").filter(w => w.length > 2)
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
Given an Indonesian research topic, extract the core entities.
Respond ONLY with a valid minified JSON object exactly like this:
{"en":["english concept 1","english concept 2"],"id":["konsep indo 1","konsep indo 2"]}
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
      llmResult = llmResult.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsedJSON = JSON.parse(llmResult);
        if (parsedJSON.en && parsedJSON.id) {
          const en_str = parsedJSON.en.map((t: string) => `"${t}"`).join(" AND ");
          const id_str = parsedJSON.id.map((t: string) => `"${t}"`).join(" AND ");
          
          return {
            query_english: en_str,
            query_indo: parsedJSON.id.join(" "),
            core_concepts: [...parsedJSON.en, ...parsedJSON.id].map(s => s.toLowerCase())
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
