"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Lock,
  User,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);
  const [imageReady, setImageReady] = React.useState(false);

  React.useEffect(() => {
    setIsUsingSupabase(!!supabase);
    setImageReady(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(true);
        // Automatically redirect to login page after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError("Terjadi kesalahan sistem saat mencoba mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      {/* ─── LEFT PANEL: DARK MODEL COVER ─── */}
      <div className="hidden lg:flex w-1/2 bg-black relative flex-col justify-between p-12 overflow-hidden select-none">
        {/* Huge Faint Watermark Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <div className="flex flex-col items-center text-[11vw] lg:text-[9.5vw] xl:text-[9vw] font-black leading-[0.8] uppercase tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="text-[#161616]">JOIN</span>
            <span className="text-[#55732d]">MOVEMENT</span>
          </div>
        </div>

        {/* Model Photo overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/batik-center.png"
            alt="Model Fashion"
            className={`h-[58%] w-auto object-contain transform translate-y-4 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)] transition-opacity duration-700 ease-out ${
              imageReady ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Small header/logo at top of left side */}
        <div className="relative z-10">
          <span className="text-zinc-500 font-mono tracking-widest text-[10px] uppercase">
            Berakit Series // Vol. 01
          </span>
        </div>

        {/* Brand name bottom-left */}
        <div className="relative z-10">
          <span 
            className="text-[#bef264] font-black text-2xl tracking-tighter uppercase" 
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            BERAKIT.
          </span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: LIGHT REGISTER FORM ─── */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 relative bg-[radial-gradient(circle_at_top_right,rgba(190,242,100,0.1),transparent_40%)]">
        
        {/* Top bar with back to store button */}
        <div className="flex justify-start items-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 text-zinc-500 hover:text-zinc-900 transition-colors group text-xs font-semibold"
          >
            <div className="size-8 rounded-full border border-zinc-200 flex items-center justify-center group-hover:border-zinc-400 group-hover:bg-zinc-50 transition-all">
              <ArrowLeft className="size-4" />
            </div>
            Back to Store
          </button>
        </div>

        {/* Center content */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-12 space-y-8">
          
          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-[38px] sm:text-[44px] font-black tracking-tight leading-none uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              CREATE<br />
              <span className="text-[#bef264]">AN ACCOUNT</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Join Berakit Series community today. Discover exclusive premium batik and manage your purchases.
            </p>
          </div>

          {/* Success State */}
          {success ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="mx-auto size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-emerald-600 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-emerald-900 uppercase">Pendaftaran Berhasil!</h3>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Akun Anda telah berhasil dibuat. Mengalihkan Anda ke halaman masuk dalam beberapa saat...
                </p>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold uppercase tracking-wider gap-1.5"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 p-4 rounded-2xl border border-red-100 bg-red-50 text-[13px] text-red-600 animate-in fade-in duration-200">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                
                {/* Full Name Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <User className="absolute left-4.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
                    <input
                      required
                      type="text"
                      placeholder="Nama Lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
                    <input
                      required
                      type="email"
                      placeholder="Alamat Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-4.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min. 6 karakter)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="w-full h-12 pl-12 pr-12 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-medium"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4.5" />
                      ) : (
                        <Eye className="size-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-4.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Konfirmasi Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-12 rounded-full border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Agree to Terms */}
                <div className="flex items-center gap-2.5 px-1 pt-1">
                  <Checkbox
                    id="agreeTerms"
                    checked={agreeTerms}
                    onCheckedChange={(v) => setAgreeTerms(v === true)}
                    className="data-[state=checked]:bg-[#bef264] data-[state=checked]:border-[#bef264] border-zinc-300 rounded"
                  />
                  <label htmlFor="agreeTerms" className="text-[11px] text-zinc-500 font-semibold cursor-pointer select-none leading-none">
                    Saya menyetujui <span className="text-zinc-900 hover:underline">Syarat & Ketentuan</span> BUMDes Berakit.
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-black hover:bg-zinc-900 text-white font-extrabold uppercase text-xs tracking-widest rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none shadow-md shadow-black/5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-[#bef264]" />
                        <span>Mendaftarkan...</span>
                      </>
                    ) : (
                      "Daftar Akun"
                    )}
                  </Button>
                </div>
              </form>

              <div className="space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-100"></div>
                  </div>
                  <span className="relative px-3 bg-white text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sudah punya akun?</span>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="w-full h-11 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 rounded-full flex items-center justify-center text-xs font-bold text-zinc-700 transition-all cursor-pointer"
                >
                  Masuk dengan Akun
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">
            Secured by Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
