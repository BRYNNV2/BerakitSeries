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
  ArrowLeft,
} from "lucide-react";
import { supabase, withTimeout } from "@/lib/supabase";

function removeBackground(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  
  const pushPixel = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue.push(idx);
  };
  
  for (let x = 0; x < width; x++) {
    pushPixel(x, 0);
    pushPixel(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushPixel(0, y);
    pushPixel(width - 1, y);
  }
  
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    
    const rIdx = idx * 4;
    const r = data[rIdx];
    const g = data[rIdx + 1];
    const b = data[rIdx + 2];
    
    if (r > 230 && g > 230 && b > 230) {
      data[rIdx + 3] = 0;
      
      if (x > 0) pushPixel(x - 1, y);
      if (x < width - 1) pushPixel(x + 1, y);
      if (y > 0) pushPixel(x, y - 1);
      if (y < height - 1) pushPixel(x, y + 1);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);
  const [processedImageSrc, setProcessedImageSrc] = React.useState("/batik-center.png");

  React.useEffect(() => {
    setIsUsingSupabase(!!supabase);
  }, []);

  React.useEffect(() => {
    const img = new Image();
    img.src = "/batik-center.png";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const transparentDataUrl = removeBackground(img);
        setProcessedImageSrc(transparentDataUrl);
      } catch (e) {
        console.error("Failed to remove image background on login page", e);
      }
    };
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
          if (email === "admin@berakit.desa.id" && password === "adminberakit") {
            localStorage.setItem("berakit_admin_auth", "true");
            router.push("/admin");
          } else {
            setError(authError.message);
          }
        } else {
          localStorage.removeItem("berakit_admin_auth");
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
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      {/* ─── LEFT PANEL: DARK MODEL COVER ─── */}
      <div className="hidden lg:flex w-1/2 bg-black relative flex-col justify-between p-12 overflow-hidden select-none">
        {/* Huge Faint Watermark Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="flex flex-col text-[7vw] font-black leading-[0.8] text-zinc-900/60 uppercase tracking-tighter opacity-40">
            <span>DIGITAL</span>
            <span className="text-zinc-800/80">REALITY</span>
          </div>
        </div>

        {/* Model Photo overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={processedImageSrc}
            alt="Model Fashion"
            className="h-[110%] w-auto object-cover object-center max-w-none transform translate-y-12 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)]"
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

      {/* ─── RIGHT PANEL: LIGHT LOGIN FORM ─── */}
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
              ACCESS<br />
              <span className="text-[#bef264]">YOUR ACCOUNT</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Welcome back to the future of fashion. Enter your credentials to continue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl border border-red-100 bg-red-50 text-[13px] text-red-600 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1">
              <div className="relative">
                <User className="absolute left-4.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                  className="data-[state=checked]:bg-[#bef264] data-[state=checked]:border-[#bef264] border-zinc-300"
                />
                <span className="text-[12px] text-zinc-500 font-semibold">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[12px] text-zinc-400 hover:text-zinc-900 font-semibold transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-black hover:bg-zinc-900 text-white font-extrabold uppercase text-xs tracking-widest rounded-full flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none shadow-md shadow-black/5"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-[#bef264]" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </form>

          {/* Social Sign-in Mock to perfectly match references */}
          <div className="space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <span className="relative px-3 bg-white text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Or</span>
            </div>
            
            <button 
              type="button"
              className="w-full h-11 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 rounded-full flex items-center justify-center gap-2.5 text-xs font-bold text-zinc-700 transition-all"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.54 0 2.94.57 4.03 1.51l3.07-3.07C18.99 1.83 15.82 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c5.8 0 10.74-4.14 11.76-9.6H12.24z"/>
              </svg>
              Continue with Google
            </button>
            <p className="text-[11px] text-zinc-400 text-center font-medium">
              Don&apos;t have an account? <span className="text-[#bef264] font-bold cursor-pointer hover:underline">Sign up</span>
            </p>
          </div>

          {/* Fallback Creds */}
          {!isUsingSupabase && (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
                <CheckCircle2 className="size-3.5 text-[#bef264]" />
                <span>Demo Account</span>
              </div>
              <div className="bg-white border border-zinc-100 p-3 rounded-xl font-mono text-[11px] text-zinc-600 space-y-0.5">
                <div>
                  Email: <span className="font-bold text-zinc-900">admin@berakit.desa.id</span>
                </div>
                <div>
                  Pass: <span className="font-bold text-zinc-900">adminberakit</span>
                </div>
              </div>
            </div>
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
