"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Mic, Mail, Lock, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reason") === "practice-session") {
      toast.error("Please log in to access your practice session.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#080c10] text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex items-center justify-center overflow-hidden px-6 py-14 sm:px-10 lg:px-14 lg:py-0 bg-linear-to-br from-[#0f1923] via-[#080c10] to-[#061018]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(103,232,249,0.08),transparent_28%)]"></div>
        <div className="relative z-10 max-w-xl space-y-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-[#06b6d4] p-2 rounded-xl text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-[#67e8f9]">
              SPOKN
            </span>
          </Link>
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-[#06b6d4]/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#67e8f9]">
              Something about this website
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Welcome back and continue your learning streak.
            </h1>
            <p className="max-w-lg text-base sm:text-lg leading-8 text-slate-300">
              Jump back in, pick up where you left off, and keep practicing with the same smooth flow across every session.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[["01", "Resume quickly"], ["02", "See your progress"], ["03", "Speak daily"]].map(([step, label]) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold tracking-[0.3em] text-[#67e8f9]">STEP {step}</p>
                <p className="mt-2 text-sm text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-14 sm:px-10 lg:px-14 bg-[#eaf8fb]">
        <div className="w-full max-w-md rounded-4xl border border-white/60 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#080c10]">Welcome Back</h2>
            <p className="mt-3 text-sm text-slate-500">Continue your journey to fluency.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1.5 pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-black bg-white py-3 pl-12 pr-4 text-black transition-colors placeholder:text-slate-400 focus:outline-none focus:border-[#06b6d4]"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between pl-1">
                <label className="block text-sm font-medium text-black">Password</label>
                <Link href="#" className="text-xs text-[#06b6d4] hover:text-[#0891b2]">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-black bg-white py-3 pl-12 pr-4 text-black transition-colors placeholder:text-slate-400 focus:outline-none focus:border-[#06b6d4]"
                  placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#06b6d4] py-3.5 font-bold text-[#080c10] transition-all hover:bg-[#0891b2] disabled:opacity-70">
              {loading ? "Logging in..." : <>Login to SPOKN <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white px-4 text-xs uppercase tracking-wider text-slate-500">or</span>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? <Link href="/register" className="font-semibold text-[#06b6d4] hover:underline">Register</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}