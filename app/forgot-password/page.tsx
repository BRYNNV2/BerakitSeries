"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Clear any previous stale recovery tokens
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("berakit_reset_token");
        window.sessionStorage.removeItem("berakit_refresh_token");
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
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
            <span className="text-[#161616]">PASSWORD</span>
            <span className="text-[#bef264]">RECOVERY</span>
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
            className="flex items-center gap-2.5 text-zinc-500 hover:text-zinc-900 transition-colors group text-xs font-semibold"
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
              Lupa<br />
              <span className="text-[#bef264]">Kata Sandi</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Masukkan email admin Anda di bawah ini. Kami akan mengirimkan tautan untuk menyetel ulang kata sandi Anda.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl border border-red-100 bg-red-50 text-[13px] text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-[13px] text-emerald-700 leading-relaxed">
                <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-bold block mb-1">Email Terkirim!</span>
                  Tautan pemulihan telah dikirim ke <span className="font-bold">{email}</span>. Silakan periksa folder inbox dan spam Anda.
                </div>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-black hover:bg-zinc-900 text-white font-extrabold uppercase text-xs tracking-widest rounded-full"
              >
                Kembali ke Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-[18px] top-1/2 -translate-y-1/2 size-[18px] text-zinc-400" />
                  <input
                    required
                    type="email"
                    placeholder="Masukkan Email Terdaftar"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      <span>Mengirim Email...</span>
                    </>
                  ) : (
                    "Kirim Link Pemulihan"
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
