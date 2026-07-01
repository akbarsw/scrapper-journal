"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import ScrapeForm from "@/components/ScrapeForm";
import ResultDisplay from "@/components/ResultDisplay";
import History from "@/components/History";

type JobStatus = "idle" | "pending" | "running" | "done" | "failed";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = useCallback(async (formData: any) => {
    setStatus("pending");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.job_id) throw new Error(data.message || "Gagal submit");

      setJobId(data.job_id);
      setStatus("running");
      pollJob(data.job_id);
    } catch (err: any) {
      setError(err.message);
      setStatus("failed");
    }
  }, []);

  function pollJob(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();
        if (data.status === "done") {
          setStatus("done");
          setResult(data.result);
          setRefreshKey((k) => k + 1);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setStatus("failed");
          setError(data.error || "Unknown error");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
        <ScrapeForm onSubmit={handleSubmit} disabled={status === "running" || status === "pending"} />
        {(status === "running" || status === "pending") && (
          <div className="text-center py-12 space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 text-lg">Mencari artikel... ±1-3 menit</p>
            <p className="text-zinc-400 text-sm">Job ID: {jobId}</p>
          </div>
        )}
        <ResultDisplay status={status} result={result} error={error} jobId={jobId} />
        {status === "idle" && <History refreshKey={refreshKey} />}
      </main>
      <footer className="text-center py-6 text-zinc-400 text-sm border-t">
        ScrapJurnal v1.0 &mdash; Built for academic research &middot;
        <a href="https://saweria.co/yourlink" target="_blank" className="text-blue-600 hover:underline ml-1">Donate</a>
      </footer>
    </>
  );
}
