"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") })
      });
      if (!response.ok) {
        setError("Invalid admin email or password");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Animated welcome header info */}
        <div className="text-center animate-fadeInUp">
          <div className="w-14 h-14 rounded-full bg-[var(--sage,#14B8C4)] flex items-center justify-center font-bold text-white text-xl mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            DD
          </div>
          <p className="text-xs uppercase tracking-widest text-[var(--primary,#38D9E6)] font-bold mb-1">
            DermaDental360 Clinic
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-white mb-2">
            Admin Portal Access
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Authorized portal for Dr. Sadaf Yamin and clinic management.
          </p>
        </div>

        {/* Login form card */}
        <form
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 animate-fadeInUp"
          onSubmit={submit}
          autoComplete="off"
        >
          <div className="border-b border-slate-800 pb-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Authentication</p>
            <h2 className="text-lg font-bold text-white">Sign In to Dashboard</h2>
          </div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm p-3.5 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <input
              className="w-full bg-slate-950 border border-slate-800 focus:border-[var(--primary,#38D9E6)] rounded-xl px-4 py-3 text-sm text-white outline-none transition-all min-h-[48px]"
              name="email"
              type="email"
              placeholder="admin@dermadental360.com"
              defaultValue=""
              autoComplete="new-email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                className="w-full bg-slate-950 border border-slate-800 focus:border-[var(--primary,#38D9E6)] rounded-xl pl-4 pr-12 py-3 text-sm text-white outline-none transition-all min-h-[48px]"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                defaultValue=""
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-2"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button
            className="w-full bg-[var(--sage-dark,#0F7F8F)] hover:bg-[var(--sage,#14B8C4)] text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg min-h-[48px] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Access Dashboard →</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
