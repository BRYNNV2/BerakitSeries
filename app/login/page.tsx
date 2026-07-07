"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store,
  Loader2,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { supabase, withTimeout } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);

  React.useEffect(() => {
    setIsUsingSupabase(!!supabase);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isUsingSupabase) {
      try {
        const { error: authError } = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password,
          })
        );

        if (authError) {
          // If Supabase auth fails, check if the input matches fallback credentials
          if (email === "admin@berakit.desa.id" && password === "adminberakit") {
            localStorage.setItem("berakit_admin_auth", "true");
            router.push("/admin");
          } else {
            setError(authError.message);
          }
        } else {
          localStorage.removeItem("berakit_admin_auth"); // Clear fallback just in case
          router.push("/admin");
        }
      } catch (err) {
        console.warn("Supabase auth error:", err);
        if (email === "admin@berakit.desa.id" && password === "adminberakit") {
          localStorage.setItem("berakit_admin_auth", "true");
          router.push("/admin");
        } else {
          setError("Terjadi kesalahan sistem saat menghubungi server Auth.");
        }
      }
    } else {
      // Local storage fallback authentication
      await new Promise((r) => setTimeout(r, 600));
      if (email === "admin@berakit.desa.id" && password === "adminberakit") {
        localStorage.setItem("berakit_admin_auth", "true");
        router.push("/admin");
      } else {
        setError("Email atau password admin salah!");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* ─── LEFT SIDE: Form ─── */}
      <div className="flex flex-1 flex-col justify-center px-8 sm:px-12 lg:px-20 py-10 relative z-10">
        {/* Subtle purple wave at bottom-left */}
        <div className="absolute bottom-0 left-0 w-[55%] h-[120px] pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 600 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120 C100 40, 250 80, 400 30 C500 0, 550 50, 600 20 L600 120 Z"
              fill="url(#wave-grad)"
              opacity="0.10"
            />
            <defs>
              <linearGradient id="wave-grad" x1="0" y1="0" x2="600" y2="0">
                <stop offset="0%" stopColor="#6e3ff3" />
                <stop offset="100%" stopColor="#aa8ef9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="w-full max-w-[400px] mx-auto space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-b from-[#6e3ff3] to-[#aa8ef9] text-white shadow-md shadow-[#6e3ff3]/20">
              <Store className="size-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#6e3ff3]">
              Berakit Hub
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-gray-900 leading-tight">
              Selamat Datang
            </h1>
            <p className="text-sm text-gray-500">
              Masuk dengan akun admin Anda untuk mengelola sistem
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-600">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                <input
                  required
                  type="email"
                  placeholder="Email Admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6e3ff3] focus:ring-2 focus:ring-[#6e3ff3]/10 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6e3ff3] focus:ring-2 focus:ring-[#6e3ff3]/10 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                  className="data-[state=checked]:bg-[#6e3ff3] data-[state=checked]:border-[#6e3ff3]"
                />
                <span className="text-[13px] text-gray-600">Ingat saya</span>
              </label>
              <button
                type="button"
                className="text-[13px] text-[#6e3ff3] hover:text-[#5a2fd4] font-medium transition-colors"
              >
                Lupa Password?
              </button>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-[#6e3ff3] to-[#aa8ef9] text-white font-semibold text-sm shadow-lg shadow-[#6e3ff3]/25 hover:shadow-[#6e3ff3]/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          {/* Demo Info — only visible when Supabase is not configured */}
          {!isUsingSupabase && (
            <div className="rounded-xl border border-[#6e3ff3]/15 bg-[#6e3ff3]/[0.03] p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6e3ff3]">
                <CheckCircle2 className="size-3.5" />
                <span>Mode Demo — Akun Lokal</span>
              </div>
              <div className="bg-white/70 border border-[#6e3ff3]/10 p-3 rounded-lg font-mono text-[12px] text-gray-700 space-y-0.5">
                <div>
                  Email:{" "}
                  <span className="font-semibold text-gray-900">
                    admin@berakit.desa.id
                  </span>
                </div>
                <div>
                  Pass:{" "}
                  <span className="font-semibold text-gray-900">
                    adminberakit
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT SIDE: Purple Decorative Panel ─── */}
      <div className="hidden lg:flex w-[48%] xl:w-[45%] relative overflow-hidden">
        {/* Main Purple Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6e3ff3] via-[#7b4ff5] to-[#9b6dfa]" />

        {/* Organic Curved Shape at the Left Edge */}
        <svg
          className="absolute left-0 top-0 h-full w-[120px]"
          viewBox="0 0 120 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M120 0 C60 150, 100 350, 40 450 C-20 550, 80 700, 120 900 L0 900 L0 0 Z"
            fill="white"
          />
        </svg>

        {/* Decorative Glow Circles */}
        <div className="absolute top-[15%] right-[15%] size-[200px] rounded-full bg-white/5 blur-[60px]" />
        <div className="absolute bottom-[20%] left-[25%] size-[250px] rounded-full bg-[#aa8ef9]/20 blur-[80px]" />

        {/* Floating Card Stack — Illustration Replacement */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[320px] h-[220px]">
            {/* Bottom card */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[180px] rounded-2xl bg-gradient-to-br from-[#f9c74f]/80 to-[#f9844a]/60 shadow-2xl transform rotate-[-6deg] translate-y-3" />
            {/* Middle card */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[290px] h-[185px] rounded-2xl bg-gradient-to-br from-[#aa8ef9]/60 to-[#6e3ff3]/40 backdrop-blur-md shadow-2xl transform rotate-[-2deg] translate-y-1 border border-white/20" />
            {/* Top card (Main dashboard preview) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[190px] rounded-2xl bg-white/95 shadow-2xl backdrop-blur-sm border border-white/50 overflow-hidden transform rotate-[2deg] -translate-y-1">
              {/* Mini dashboard skeleton */}
              <div className="p-4 space-y-3">
                {/* Top bar */}
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded bg-gradient-to-br from-[#6e3ff3] to-[#aa8ef9]" />
                  <div className="h-2.5 w-20 rounded-full bg-gray-200" />
                  <div className="ml-auto h-2 w-12 rounded-full bg-gray-100" />
                </div>
                {/* Stats row */}
                <div className="flex gap-2">
                  <div className="flex-1 h-12 rounded-lg bg-[#6e3ff3]/5 p-2">
                    <div className="h-1.5 w-8 rounded-full bg-[#6e3ff3]/20 mb-1.5" />
                    <div className="h-3 w-14 rounded-full bg-[#6e3ff3]/30" />
                  </div>
                  <div className="flex-1 h-12 rounded-lg bg-[#aa8ef9]/5 p-2">
                    <div className="h-1.5 w-8 rounded-full bg-[#aa8ef9]/20 mb-1.5" />
                    <div className="h-3 w-14 rounded-full bg-[#aa8ef9]/30" />
                  </div>
                  <div className="flex-1 h-12 rounded-lg bg-emerald-500/5 p-2">
                    <div className="h-1.5 w-8 rounded-full bg-emerald-500/20 mb-1.5" />
                    <div className="h-3 w-14 rounded-full bg-emerald-500/30" />
                  </div>
                </div>
                {/* Chart placeholder */}
                <div className="h-[70px] rounded-lg bg-gray-50 flex items-end gap-1 px-3 pb-2 pt-3">
                  <div className="flex-1 h-[20%] rounded-sm bg-[#6e3ff3]/15" />
                  <div className="flex-1 h-[50%] rounded-sm bg-[#6e3ff3]/25" />
                  <div className="flex-1 h-[35%] rounded-sm bg-[#6e3ff3]/20" />
                  <div className="flex-1 h-[70%] rounded-sm bg-[#6e3ff3]/35" />
                  <div className="flex-1 h-[55%] rounded-sm bg-[#6e3ff3]/30" />
                  <div className="flex-1 h-[85%] rounded-sm bg-gradient-to-t from-[#6e3ff3]/50 to-[#aa8ef9]/30" />
                  <div className="flex-1 h-[40%] rounded-sm bg-[#6e3ff3]/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text overlay at bottom */}
        <div className="absolute bottom-10 left-0 right-0 text-center px-8">
          <p className="text-white/90 font-semibold text-lg">
            Panel Admin BUMDes
          </p>
          <p className="text-white/50 text-sm mt-1">
            Kelola penjualan dan produk Desa Berakit dengan mudah
          </p>
        </div>
      </div>
    </div>
  );
}
