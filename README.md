# Nemu Jurnal

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.dotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**Nemu Jurnal** is a premium research journal scraper and aggregator. It is designed to help researchers, students, and academics find, rank, and curate research papers from multiple search engines using a unified interface and intelligent machine-learning scoring mechanisms.

---

## Key Features
*   **Unified Search**: Scrape and aggregate papers in real-time from Scopus, Semantic Scholar, Crossref, and OpenAlex.
*   **AI-Driven Reranking**: Utilizes LLMs (DeepSeek/Gemini) to check relevance and assign a premium "AI Verified" badge to high-quality matches.
*   **Composite Scoring Engine**: Ranks papers dynamically based on keyword match density (BM25), citation impact, and publication recency.
*   **Global Collaborative Feedback**: Rate papers as helpful (👍) or less relevant (👎). Votes are aggregated globally in the database so other users can see popular research.
*   **Personal Collections**: Organize bookmarks into folders and add custom notes and tags.

---

## Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (version 18 or newer)
*   [npm](https://www.npmjs.com/) or another package manager
*   A [Supabase](https://supabase.com/) account (or a local Supabase Docker instance)

### 2. Setup Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Fill in the required values:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External Academic API Keys
S2_API_KEY=your-semantic-scholar-api-key
SCOPUS_API_KEY=your-scopus-api-key
OPENALEX_API_KEY=your-openalex-api-key

# LLM Gateway Settings
ROUTER_API_KEY=your-openmodel-gateway-api-key
```

### 3. Setup Supabase Tables
Run the unified SQL migration in your Supabase SQL Editor:
1. Copy the content of [sql_migration.sql](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/scrapper-journal/sql_migration.sql).
2. Execute it in the Supabase Dashboard SQL Editor to initialize all tables, enable Row Level Security (RLS), and install the required index speed-ups.

### 4. Install Dependencies
Install all package dependencies:
```bash
npm install
```

### 5. Run the Local Dev Server
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to access the local application interface.
