"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [hasToken, setHasToken] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Capture access token and refresh token from URL hash fragment immediately on page load
      const hash = window.location.hash;
      let token = window.sessionStorage.getItem("berakit_reset_token");
      
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const hashToken = params.get("access_token");
        const hashRefresh = params.get("refresh_token");
        if (hashToken) {
          token = hashToken;
          window.sessionStorage.setItem("berakit_reset_token", hashToken);
        }
        if (hashRefresh) {
          window.sessionStorage.setItem("berakit_refresh_token", hashRefresh);
        }
      }

      setHasToken(!!token);
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi harus minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        // Clear tokens from session storage on success
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("berakit_reset_token");
          window.sessionStorage.removeItem("berakit_refresh_token");
        }
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      {/* LEFT PANEL: Cover image / Watermark */}
      <div className="hidden lg:flex w-1/2 bg-black relative flex-col justify-between p-12 overflow-hidden select-none">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <div className="flex flex-col items-center text-[10vw] font-black leading-[0.8] uppercase tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="text-[#161616]">NEW</span>
            <span className="text-[#bef264]">PASSWORD</span>
          </div>
        </div>

        <div className="relative z-10">
          <span className="text-zinc-500 font-mono tracking-widest text-[10px] uppercase">
            BUMDes Berakit // System
          </span>
        </div>

        <div className="relative z-10">
          <span className="text-[#bef264] font-black text-2xl tracking-tighter uppercase">
            BERAKIT.
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 relative bg-[radial-gradient(circle_at_top_right,rgba(190,242,100,0.1),transparent_40%)]">
        <div className="flex justify-start items-center">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2.5 text-zinc-500 hover:text-zinc-950 transition-colors group text-xs font-semibold"
          >
            <div className="size-8 rounded-full border border-zinc-200 flex items-center justify-center group-hover:border-zinc-400 group-hover:bg-zinc-50 transition-all">
              <ArrowLeft className="size-4" />
            </div>
            Kembali ke Login
          </button>
        </div>

        <div className="max-w-[420px] w-full mx-auto my-auto py-12 space-y-8">
          <div className="space-y-3">
            <h1 className="text-[34px] sm:text-[38px] font-black tracking-tight leading-none uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              Setel Ulang<br />
              <span className="text-[#bef264]">Kata Sandi</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Masukkan kata sandi baru untuk akun administrator BUMDes Anda di bawah ini.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl border border-red-100 bg-red-50 text-[13px] text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {hasToken === null ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin text-[#bef264]" />
            </div>
          ) : hasToken === false ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-rose-100 bg-rose-50 text-[13px] text-rose-700 leading-relaxed">
                <AlertCircle className="size-5 shrink-0 mt-0.5 text-[#ef4444]" />
                <div>
                  <span className="font-bold block mb-1">Tautan Tidak Valid / Kadaluarsa</span>
                  Tautan pemulihan kata sandi tidak ditemukan atau sudah digunakan sebelumnya. Silakan lakukan proses Lupa Kata Sandi kembali untuk mendapatkan tautan baru.
                </div>
              </div>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="w-full h-12 bg-black hover:bg-zinc-900 text-white font-extrabold uppercase text-xs tracking-widest rounded-full"
              >
                Minta Tautan Baru
              </Button>
            </div>
          ) : success ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-[13px] text-emerald-700 leading-relaxed">
                <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-bold block mb-1">Kata Sandi Diperbarui!</span>
                  Kata sandi baru Anda telah disimpan. Silakan masuk kembali menggunakan kredensial baru tersebut.
                </div>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-black hover:bg-zinc-900 text-white font-extrabold uppercase text-xs tracking-widest rounded-full"
              >
                Login Sekarang
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-[18px] top-1/2 -translate-y-1/2 size-[18px] text-zinc-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Kata Sandi Baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-12 pr-12 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[18px] top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-[18px] top-1/2 -translate-y-1/2 size-[18px] text-zinc-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Konfirmasi Kata Sandi Baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-black hover:bg-zinc-900 text-white font-extrabold uppercase text-xs tracking-widest rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#bef264]" />
                      <span>Memperbarui Sandi...</span>
                    </>
                  ) : (
                    "Setel Ulang Kata Sandi"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">
            Secured by Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
