CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vars TEXT NOT NULL,
  year_from INT,
  year_to INT,
  min_cited INT DEFAULT 0,
  lang TEXT DEFAULT 'both',
  exclude TEXT,
  scopus BOOLEAN DEFAULT true,
  limit_count INT DEFAULT 20,
  total_results INT DEFAULT 0,
  sources JSONB,
  time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_cache (
  query_hash TEXT PRIMARY KEY,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_minutes INT DEFAULT 60
);
