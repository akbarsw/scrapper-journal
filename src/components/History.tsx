"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function History({ refreshKey }: { refreshKey: number }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch("/api/history", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        const d = await res.json();
        setHistory(d.jobs || []);
      } catch (err) {}
    };
    loadHistory();
  }, [refreshKey]);

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">📋 Riwayat Pencarian</h2>
        <p className="text-sm text-zinc-400">Belum ada riwayat. Mulai scraping untuk melihat hasil.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">📋 Riwayat Pencarian</h2>
      <div className="space-y-0 divide-y">
        {history.map((j: any) => (
          <div key={j.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-zinc-500">{j.created?.slice(0, 16) || "?"}</span>
            <span className={
              j.status === "done" ? "text-green-600" : 
              j.status === "failed" ? "text-red-500" : 
              "text-zinc-400"
            }>{j.status}</span>
            <span className="text-zinc-400 font-mono text-xs">{j.id?.slice(0, 8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
