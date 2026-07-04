"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

const SignInGoogleOnly = () => {
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, 
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 z-1">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 flex flex-col items-center border border-blue-100 text-black">
        
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg shadow-opacity-5">
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          ScrapJurnal AI
        </h2>
        <p className="text-gray-500 text-sm mb-8 text-center px-4">
          Sign in to unlock hybrid academic search and smart literature reviews.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-800 font-medium py-3 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition duration-200 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
          )}
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="mt-8 text-xs text-gray-400 text-center">
          By continuing, you agree to our <span className="hover:underline cursor-pointer text-gray-500">Terms</span> and <span className="hover:underline cursor-pointer text-gray-500">Privacy</span>.
        </div>

      </div>
    </div>
  );
};

export default SignInGoogleOnly;
