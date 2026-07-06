# Nemu Jurnal — Developer Guide (AGENTS.md)

This document is the authoritative guide for agent operations, coding conventions, architectural specifications, and integration structures in the **Nemu Jurnal** codebase.

---

## 1. Project Architecture

The codebase follows the Next.js App Router structure under the `src` directory:

```text
├── src/
│   ├── app/                      # App router directory
│   │   ├── api/                  # Server-side API endpoints
│   │   │   ├── feedback/         # /api/feedback - saves user 👍/👎 votes
│   │   │   ├── history/          # /api/history - returns search query history
│   │   │   └── scrape/           # /api/scrape - real-time academic paper scraping & scoring
│   │   ├── login/                # Login & Auth page
│   │   ├── globals.css           # Styling
│   │   ├── layout.tsx            # HTML Root layout
│   │   └── page.tsx              # Main dashboard UI
│   ├── components/               # Reusable React components
│   │   ├── History.tsx           # Displays search history panel
│   │   ├── ResultDisplay.tsx     # Displays search results, voting counters, and abstracts
│   │   ├── Sidebar.tsx           # Navigation panel
│   │   └── ui/                   # Basic shadcn/custom primitives
│   ├── lib/                      # Shared helper utilities
│   │   ├── store.ts              # Zustand client state (bookmarks, votes, active UI tabs)
│   │   ├── supabase.ts           # Server-side Supabase client (service role)
│   │   └── supabaseClient.ts     # Client-side Supabase client (anon role)
│   └── sources/                  # Search engine clients & scoring engine
│       ├── crossref.ts           # Crossref integration
│       ├── engine.ts             # Orchestrates multi-engine queries, cache checking, and scoring
│       ├── llm.ts                # DeepSeek/Gemini client for AI relevance verification
│       ├── openalex.ts           # OpenAlex integration
│       ├── scopus.ts             # Scopus (Elsevier) integration
│       ├── semanticscholar.ts    # Semantic Scholar integration
│       └── types.ts              # Global TypeScript interfaces for papers & api results
```

---

## 2. Naming Conventions

*   **UI Components**: Use PascalCase (e.g., `ResultDisplay.tsx`, `History.tsx`).
*   **Helper Utilities / API Routes**: Use camelCase or lowercase/dashes (e.g., `store.ts`, `supabaseClient.ts`, `feedback/route.ts`).
*   **Database Tables**: Use lowercase snake_case (e.g., `saved_papers`, `search_history`, `paper_feedback`, `collections`, `collection_papers`).
*   **Functions**: Use camelCase (e.g., `searchAll`, `calculateLexicalScore`, `rerankPapers`).

---

## 3. Academic Data Sources & Integrations

Each file under `src/sources/` encapsulates query building, API requests, and data normalization:

### A. OpenAlex (`openalex.ts`)
*   **Endpoint**: `https://api.openalex.org/works`
*   **Method**: `GET`
*   **Search Parameter**: `?search=query`
*   **Format/Filters**: Commas represent filter delimiters. We use the separate query parameter `search` for text matching, while using `filter=from_publication_date:YYYY-MM-DD` for metadata filtering.
*   **Authentication**: Optional API Key via `api_key` parameter.

### B. Semantic Scholar (`semanticscholar.ts`)
*   **Endpoint**: `https://api.semanticscholar.org/graph/v1/paper/search`
*   **Method**: `GET`
*   **Request Params**: `query`, `limit`, `fields` (title, authors, year, journal, externalIds, citationCount, abstract, url).
*   **Authentication**: Provided via HTTP header `x-api-key`.

### C. Crossref (`crossref.ts`)
*   **Endpoint**: `https://api.crossref.org/works`
*   **Method**: `GET`
*   **Request Params**: `query`, `rows`, `sort=relevance`, `mailto=EMAIL`.
*   **Authentication**: Free identified usage by providing a contact email in the `mailto` parameter to enter the Polite Pool.

### D. Scopus (`scopus.ts`)
*   **Endpoint**: `https://api.elsevier.com/content/search/scopus`
*   **Method**: `GET`
*   **Request Params**: `query` (utilizes Scopus specific query syntax: `TITLE-ABS-KEY("term")`), `count`.
*   **Authentication**: Requires the HTTP header `X-ELS-APIKey`.

---

## 4. Composite Scoring Logic

The scoring engine (`src/sources/engine.ts`) calculates a composite `_relevanceScore` out of 100 for each candidate paper using the following components:

$$\text{Score} = (\text{Lexical Score} \times 0.4) + (\text{Citation Score} \times 0.2) + (\text{Recency Score} \times 0.3) + (\text{AI Verified Score} \times 0.1)$$

### A. Lexical Score (Max 20 Points)
Calculates raw keyword density matching on the title and abstract. For each term in the query:
*   `+4` points per term match in the **Title**.
*   `+2` points per term match in the **Abstract**.

### B. Citation Score (Max 10 Points)
Measures scientific impact based on total citations.
*   $$\text{Score} = \min\left(\ln(\text{citations} + 1) \times 1.5, 10\right)$$

### C. Recency Score (Max 3 Points)
Rewards fresh research based on publication year.
*   `3` points if published within the current year or last 2 years.
*   `2` points if published within the last 5 years.
*   `1` point if published within the last 10 years.
*   `0` points if older than 10 years.

### D. AI Verified Score (Bonus 10 Points)
The LLM reranker evaluates candidate abstracts for semantic alignment with the search theme. If the LLM verifies the relevance, the paper receives a **+10** point boost and displays the `AI Verified` badge.

### E. Hard Cutoff Filter
To remove noisy out-of-topic search items, any paper with a composite relevance score of **less than 5** is discarded from the results list.

---

## 5. Security & Invariant Rules (DO NOT CHANGE)

*   **Secrets Isolation**: Never reference process environment variables containing credentials (`SCOPUS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ROUTER_API_KEY`) inside client-side components. All API requests must route through our Next.js API backend.
*   **Authentication Contract**: API routes must read user session identity by verifying the `Authorization: Bearer <token>` header against Supabase auth.
*   **Backward Compatibility**: When updating API routes, maintain backward compatibility by returning old fields alongside updated response objects.

---

## 6. Environment Variables

Access env variables on the server-side as follows:
*   `process.env.NEXT_PUBLIC_SUPABASE_URL` (Client & Server safe)
*   `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (Client & Server safe)
*   `process.env.SUPABASE_SERVICE_ROLE_KEY` (Server ONLY)
*   `process.env.S2_API_KEY` (Server ONLY)
*   `process.env.SCOPUS_API_KEY` (Server ONLY)
*   `process.env.OPENALEX_API_KEY` (Server ONLY)
*   `process.env.ROUTER_API_KEY` (Server ONLY)

---

## 7. Error Handling & Local Testing

### Error Handling Pattern
Always wrap network operations and database calls in `try/catch`. All server endpoints must respond with consistent JSON formatting:
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}
```

### Local Testing Command
Verify code builds cleanly before committing changes:
```bash
npm run build
```
