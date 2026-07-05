// Unified schema for all sources
export interface Paper {
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi: string | null;
  cited: number;
  url: string;
  source: string;
  abstract: string | null;
  sourceKey?: string;
}

export interface SourceResult {
  papers: Paper[];
  total: number;
  error?: string;
}
