"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EmailAuth() {
  const [isLogin, setIsLogin] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState({ text: "", type: "" });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (isLogin) {
        // Mode Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Kalo sukses login, gausah tampilin apa2, useEffect di page.tsx otomatis nendang ke home
        window.location.href = "/";
      } else {
        // Mode Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });
        if (error) throw error;
        
        setMessage({ 
          text: "Sukses! Cek inbox/spam email lu buat klik link konfirmasi.", 
          type: "success" 
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 z-1">
      <div className="w-full max-w-sm bg-gradient-to-b from-teal-50/50 to-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 flex flex-col items-center border border-teal-100 text-black">
        
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg shadow-opacity-5">
          <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-gray-500 text-sm mb-6 text-center px-2">
          {isLogin 
            ? "Sign in to access your Nemu Jurnal workspace." 
            : "Sign up to start searching academic papers."}
        </p>

        <form onSubmit={handleAuth} className="w-full flex flex-col gap-4 mb-2">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-gray-50 text-black text-sm transition"
          />
          <input
            type="password"
            placeholder="Password (min. 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-gray-50 text-black text-sm transition"
          />

          {message.text && (
            <div className={`text-sm text-center mt-1 p-2 rounded-lg ${message.type === 'error' ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white font-medium py-3 rounded-xl shadow-sm hover:bg-teal-700 cursor-pointer transition duration-200 disabled:opacity-50 mt-2"
          >
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500 text-center">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setMessage({text:"", type:""}); }}
            className="text-teal-600 hover:underline font-semibold"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}
