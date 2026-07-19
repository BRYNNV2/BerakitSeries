"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Ruler,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { gsap } from "gsap";

export default function SizeGuidePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"pria" | "wanita" | "cara-mengukur">("pria");

  React.useEffect(() => {
    // Page fade-in animation
    gsap.fromTo(
      ".animate-fade-in",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 }
    );

    // Fetch user session
    const fetchUser = async () => {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setCurrentUser(session.user);
          }
        } catch (e) {
          console.warn("Failed fetching session:", e);
        }
      }
    };
    fetchUser();

    // Fetch cart count
    const updateCartCount = () => {
      try {
        const storedCart = localStorage.getItem("berakit_cart");
        if (storedCart) {
          const cartItems = JSON.parse(storedCart);
          const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartItemCount(totalItems);
        }
      } catch (err) {
        console.warn("Failed parsing cart data:", err);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f5] text-zinc-900 flex flex-col font-sans overflow-x-hidden pt-16">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 w-full border-b border-zinc-200/50 bg-[#faf9f5]/90 backdrop-blur-md">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <span
            className="uppercase tracking-normal cursor-pointer select-none"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 900,
              color: "lab(2.75381 0 0)",
              fontSize: "clamp(20px, 4vw, 30px)",
              lineHeight: "clamp(24px, 4vw, 36px)",
            }}
            onClick={() => router.push("/")}
          >
            BERAKIT SERIES.
          </span>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/"
              className="relative opacity-60 hover:opacity-100 transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                color: "lab(2.75381 0 0)",
              }}
            >
              Home
            </a>
            <a
              href="/product"
              className="relative opacity-60 hover:opacity-100 transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                color: "lab(2.75381 0 0)",
              }}
            >
              Collections
            </a>
            <a
              href="/gallery"
              className="relative opacity-60 hover:opacity-100 transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                color: "lab(2.75381 0 0)",
              }}
            >
              Gallery
            </a>

            {/* Dropdown Menu for Company */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 relative opacity-60 hover:opacity-100 transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] outline-none cursor-pointer" style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                color: "lab(2.75381 0 0)",
              }}>
                Company <ChevronDown className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white border border-zinc-200 shadow-xl rounded-2xl p-1.5 mt-2 animate-in fade-in-50 slide-in-from-top-1 duration-200 z-[99]">
                <DropdownMenuItem 
                  onClick={() => router.push("/about")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer outline-none"
                >
                  About Us
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push("/careers")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer outline-none"
                >
                  Careers
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 rounded-xl cursor-not-allowed opacity-50 outline-none"
                >
                  <span>Press</span>
                  <span className="text-[9px] lowercase font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm">soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 rounded-xl cursor-not-allowed opacity-50 outline-none"
                >
                  <span>Sustainability</span>
                  <span className="text-[9px] lowercase font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm">soon</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dropdown Menu for Support */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 relative transition-all duration-300 opacity-100 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-[#bef264] outline-none cursor-pointer" style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                color: "lab(2.75381 0 0)",
              }}>
                Support <ChevronDown className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white border border-zinc-200 shadow-xl rounded-2xl p-1.5 mt-2 animate-in fade-in-50 slide-in-from-top-1 duration-200 z-[99]">
                <DropdownMenuItem 
                  onClick={() => router.push("/contact")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer outline-none"
                >
                  Contact Us
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push("/faq")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer outline-none"
                >
                  FAQs
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 rounded-xl cursor-not-allowed opacity-50 outline-none"
                >
                  <span>Shipping</span>
                  <span className="text-[9px] lowercase font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm">soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  disabled
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 rounded-xl cursor-not-allowed opacity-50 outline-none"
                >
                  <span>Returns</span>
                  <span className="text-[9px] lowercase font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm">soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push("/size-guide")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#bef264] bg-black rounded-xl cursor-pointer outline-none"
                >
                  Size Guide
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-4 sm:gap-6">
            {currentUser ? (
              <button
                className="hidden sm:block uppercase transition-colors duration-200 hover:opacity-80"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "lab(7.78201 -0.0000149012 0)",
                }}
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="hidden sm:block uppercase transition-colors duration-200 hover:opacity-80"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "lab(7.78201 -0.0000149012 0)",
                }}
                onClick={() => router.push("/login")}
              >
                Login
              </button>
            )}
            <button
              onClick={() => router.push("/product?show_cart=true")}
              className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <ShoppingBag className="size-5 text-zinc-900" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-[#bef264] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#faf9f5]">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2 hover:bg-zinc-100 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-[#faf9f5] flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-6">
            <nav className="flex flex-col gap-4">
              <a
                href="/"
                className="text-lg font-bold transition-colors hover:text-black py-2 border-b border-zinc-100"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/product"
                className="text-lg font-bold transition-colors hover:text-black py-2 border-b border-zinc-100"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Collections
              </a>
              <a
                href="/gallery"
                className="text-lg font-bold transition-colors hover:text-black py-2 border-b border-zinc-100"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gallery
              </a>

              {/* Company Accordion */}
              <div className="py-2 border-b border-zinc-100 flex flex-col gap-2">
                <span 
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
                >
                  Company
                </span>
                <div className="pl-4 flex flex-col gap-2 border-l border-zinc-200">
                  <a
                    href="/about"
                    className="text-sm font-bold text-zinc-550 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About Us
                  </a>
                  <a
                    href="/careers"
                    className="text-sm font-bold text-zinc-550 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Careers
                  </a>
                  <div
                    className="text-sm font-semibold text-zinc-400 py-1 flex items-center justify-between opacity-60"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    <span>Press</span>
                    <span className="text-[8px] lowercase font-mono bg-zinc-100 text-zinc-500 px-1 rounded-sm">soon</span>
                  </div>
                  <div
                    className="text-sm font-semibold text-zinc-400 py-1 flex items-center justify-between opacity-60"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    <span>Sustainability</span>
                    <span className="text-[8px] lowercase font-mono bg-zinc-100 text-zinc-500 px-1 rounded-sm">soon</span>
                  </div>
                </div>
              </div>

              {/* Support Accordion */}
              <div className="py-2 border-b border-zinc-100 flex flex-col gap-2">
                <span 
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
                >
                  Support
                </span>
                <div className="pl-4 flex flex-col gap-2 border-l border-zinc-200">
                  <a
                    href="/contact"
                    className="text-sm font-bold text-zinc-550 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact Us
                  </a>
                  <a
                    href="/faq"
                    className="text-sm font-bold text-zinc-550 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    FAQs
                  </a>
                  <div
                    className="text-sm font-semibold text-zinc-400 py-1 flex items-center justify-between opacity-60"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    <span>Shipping</span>
                    <span className="text-[8px] lowercase font-mono bg-zinc-100 text-zinc-500 px-1 rounded-sm">soon</span>
                  </div>
                  <div
                    className="text-sm font-semibold text-zinc-400 py-1 flex items-center justify-between opacity-60"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    <span>Returns</span>
                    <span className="text-[8px] lowercase font-mono bg-zinc-100 text-zinc-500 px-1 rounded-sm">soon</span>
                  </div>
                  <a
                    href="/size-guide"
                    className="text-sm font-bold text-zinc-950 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Size Guide
                  </a>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-20">
        
        {/* Intro */}
        <section className="text-center space-y-4 mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200/50 text-[10px] font-bold uppercase tracking-widest">
            <Ruler className="size-3.5 text-[#bef264]" /> Size Guide & Measurements
          </div>
          <h1 
            className="text-4xl sm:text-6xl font-black uppercase text-zinc-950 tracking-tight leading-none"
            style={{ fontFamily: "'Oswald', Impact, sans-serif" }}
          >
            PANDUAN UKURAN<span className="text-[#bef264]">.</span>
          </h1>
          <p className="text-zinc-550 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Untuk memastikan fitting pakaian batik Anda nyaman dan sempurna, harap perhatikan panduan pengukuran kami di bawah ini sebelum membeli.
          </p>
        </section>

        {/* Visual & Table Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-20">
          
          {/* Left Column: Visual Guide (uploaded image SizeGuide.png) */}
          <div className="lg:col-span-6 space-y-6 animate-fade-in">
            <div className="bg-white border border-zinc-200/60 p-4 sm:p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
              <div className="aspect-[4/5] bg-zinc-50 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-100">
                <img 
                  src="/SizeGuide.png" 
                  alt="Panduan Ukuran Batik Berakit Series"
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-4 flex items-center gap-2.5 text-zinc-400 bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                <Info className="size-4 text-[#bef264] shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider leading-relaxed text-left font-mono">
                  Gambar di atas merupakan ilustrasi panduan titik pengukuran standar pakaian Berakit Series.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Tabs and Size Tables */}
          <div className="lg:col-span-6 space-y-8 animate-fade-in text-left">
            {/* Custom Tab Selector */}
            <div className="flex bg-zinc-100 p-1.5 rounded-full border border-zinc-200/50">
              <button
                onClick={() => setActiveTab("pria")}
                className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === "pria"
                    ? "bg-black text-[#bef264] shadow-md"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Kemeja Pria
              </button>
              <button
                onClick={() => setActiveTab("wanita")}
                className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === "wanita"
                    ? "bg-black text-[#bef264] shadow-md"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Blouse Wanita
              </button>
              <button
                onClick={() => setActiveTab("cara-mengukur")}
                className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === "cara-mengukur"
                    ? "bg-black text-[#bef264] shadow-md"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Cara Mengukur
              </button>
            </div>

            {/* Tab 1: Kemeja Pria Table */}
            {activeTab === "pria" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="border border-zinc-200/60 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead>
                        <tr className="bg-zinc-950 text-white uppercase text-[10px] tracking-widest font-mono border-none">
                          <th className="px-5 py-4 font-black">Ukuran</th>
                          <th className="px-5 py-4 font-black">Lebar Dada (LD)</th>
                          <th className="px-5 py-4 font-black">Panjang Baju</th>
                          <th className="px-5 py-4 font-black">Lebar Bahu</th>
                          <th className="px-5 py-4 font-black">Panjang Lengan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">S</td>
                          <td className="px-5 py-4 font-mono">48 cm</td>
                          <td className="px-5 py-4 font-mono">68 cm</td>
                          <td className="px-5 py-4 font-mono">42 cm</td>
                          <td className="px-5 py-4 font-mono">23 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">M</td>
                          <td className="px-5 py-4 font-mono">51 cm</td>
                          <td className="px-5 py-4 font-mono">70 cm</td>
                          <td className="px-5 py-4 font-mono">44 cm</td>
                          <td className="px-5 py-4 font-mono">24 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">L</td>
                          <td className="px-5 py-4 font-mono">54 cm</td>
                          <td className="px-5 py-4 font-mono">72 cm</td>
                          <td className="px-5 py-4 font-mono">46 cm</td>
                          <td className="px-5 py-4 font-mono">25 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">XL</td>
                          <td className="px-5 py-4 font-mono">57 cm</td>
                          <td className="px-5 py-4 font-mono">74 cm</td>
                          <td className="px-5 py-4 font-mono">48 cm</td>
                          <td className="px-5 py-4 font-mono">26 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">XXL</td>
                          <td className="px-5 py-4 font-mono">60 cm</td>
                          <td className="px-5 py-4 font-mono">76 cm</td>
                          <td className="px-5 py-4 font-mono">50 cm</td>
                          <td className="px-5 py-4 font-mono">27 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed font-mono">
                  * Catatan: Toleransi perbedaan ukuran sekitar ± 1-2 cm wajar karena proses penjahitan batik tulis handmade.
                </p>
              </div>
            )}

            {/* Tab 2: Blouse Wanita Table */}
            {activeTab === "wanita" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="border border-zinc-200/60 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium border-collapse">
                      <thead>
                        <tr className="bg-zinc-950 text-white uppercase text-[10px] tracking-widest font-mono border-none">
                          <th className="px-5 py-4 font-black">Ukuran</th>
                          <th className="px-5 py-4 font-black">Lebar Dada (LD)</th>
                          <th className="px-5 py-4 font-black">Panjang Baju</th>
                          <th className="px-5 py-4 font-black">Lingkar Pinggul</th>
                          <th className="px-5 py-4 font-black">Panjang Lengan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">S</td>
                          <td className="px-5 py-4 font-mono">44 cm</td>
                          <td className="px-5 py-4 font-mono">60 cm</td>
                          <td className="px-5 py-4 font-mono">92 cm</td>
                          <td className="px-5 py-4 font-mono">40 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">M</td>
                          <td className="px-5 py-4 font-mono">46 cm</td>
                          <td className="px-5 py-4 font-mono">62 cm</td>
                          <td className="px-5 py-4 font-mono">96 cm</td>
                          <td className="px-5 py-4 font-mono">41 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">L</td>
                          <td className="px-5 py-4 font-mono">48 cm</td>
                          <td className="px-5 py-4 font-mono">64 cm</td>
                          <td className="px-5 py-4 font-mono">100 cm</td>
                          <td className="px-5 py-4 font-mono">42 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">XL</td>
                          <td className="px-5 py-4 font-mono">51 cm</td>
                          <td className="px-5 py-4 font-mono">66 cm</td>
                          <td className="px-5 py-4 font-mono">106 cm</td>
                          <td className="px-5 py-4 font-mono">43 cm</td>
                        </tr>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-zinc-950">XXL</td>
                          <td className="px-5 py-4 font-mono">54 cm</td>
                          <td className="px-5 py-4 font-mono">68 cm</td>
                          <td className="px-5 py-4 font-mono">112 cm</td>
                          <td className="px-5 py-4 font-mono">44 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed font-mono">
                  * Catatan: Toleransi perbedaan ukuran sekitar ± 1-2 cm wajar karena proses penjahitan batik tulis handmade.
                </p>
              </div>
            )}

            {/* Tab 3: Cara Mengukur */}
            {activeTab === "cara-mengukur" && (
              <div className="space-y-6 animate-in fade-in duration-300 text-left">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <span className="size-8 rounded-full bg-black text-[#bef264] flex items-center justify-center text-xs font-black font-mono shrink-0">1</span>
                    <div>
                      <h4 className="font-extrabold text-sm uppercase text-zinc-900">Lebar Dada (LD)</h4>
                      <p className="text-zinc-550 text-xs leading-relaxed mt-1">
                        Bentangkan baju Anda di permukaan yang datar. Ukur dari batas ketiak kiri lurus secara mendatar hingga batas ketiak kanan.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="size-8 rounded-full bg-black text-[#bef264] flex items-center justify-center text-xs font-black font-mono shrink-0">2</span>
                    <div>
                      <h4 className="font-extrabold text-sm uppercase text-zinc-900">Panjang Baju</h4>
                      <p className="text-zinc-550 text-xs leading-relaxed mt-1">
                        Ukur tegak lurus mulai dari batas jahitan kerah/bahu paling atas hingga ujung bawah kemeja/blouse.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="size-8 rounded-full bg-black text-[#bef264] flex items-center justify-center text-xs font-black font-mono shrink-0">3</span>
                    <div>
                      <h4 className="font-extrabold text-sm uppercase text-zinc-900">Panjang Lengan</h4>
                      <p className="text-zinc-550 text-xs leading-relaxed mt-1">
                        Ukur mulai dari batas jahitan pundak terluar menyusuri lengan baju hingga bagian ujung pergelangan kemeja/blouse.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#bef264]/10 border border-[#bef264]/20 rounded-2xl p-4 flex gap-3 items-start">
                  <Info className="size-5 text-zinc-900 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-800 leading-relaxed font-semibold">
                    <strong>Tips Belanja Batik:</strong> Jika ukuran tubuh Anda berada di antara dua opsi, kami menyarankan untuk memilih ukuran yang lebih besar agar batik tetap nyaman dikenakan saat bergerak.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer Section */}
      <footer className="w-full bg-[#050505] py-16 border-t border-zinc-900 relative z-10 overflow-hidden text-white">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16 text-left relative z-10">
            {/* Column 1: Logo, Description & Socials */}
            <div className="lg:col-span-2 space-y-6">
              <span 
                className="text-white uppercase tracking-tighter block"
                style={{
                  fontFamily: "'Oswald', Impact, sans-serif",
                  fontWeight: 900,
                  fontSize: "24px",
                  lineHeight: "1.0"
                }}
              >
                BERAKIT SERIES<span className="text-[#bef264]">.</span>
              </span>
              <p 
                className="text-zinc-400 text-sm max-w-sm leading-relaxed font-normal"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Eksplorasi mahakarya kain batik tulis pesisir Berakit. Elevate Your Style in Every Reality.
              </p>
              
              {/* Social icons */}
              <div className="flex items-center gap-3">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-white hover:text-black hover:bg-[#bef264] hover:border-[#bef264] transition-all duration-300"
                >
                  <Facebook className="size-4" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-white hover:text-black hover:bg-[#bef264] hover:border-[#bef264] transition-all duration-300"
                >
                  <Twitter className="size-4" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-white hover:text-black hover:bg-[#bef264] hover:border-[#bef264] transition-all duration-300"
                >
                  <Instagram className="size-4" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-white hover:text-black hover:bg-[#bef264] hover:border-[#bef264] transition-all duration-300"
                >
                  <Youtube className="size-4" />
                </a>
              </div>
            </div>

            {/* Column 2: SHOP */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest" style={{ fontFamily: "Consolas, monospace" }}>
                SHOP
              </h5>
              <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                <li><a href="/product?sort=newest" className="hover:text-[#bef264] transition-colors">New Arrivals</a></li>
                <li><a href="/product?sort=price-high" className="hover:text-[#bef264] transition-colors">Best Sellers</a></li>
                <li><a href="/product?category=Batik%20Tulis" className="hover:text-[#bef264] transition-colors">Batik Tulis</a></li>
                <li><a href="/product?category=Batik%20Cap" className="hover:text-[#bef264] transition-colors">Batik Cap</a></li>
                <li><a href="/product?category=Batik%20Kombinasi" className="hover:text-[#bef264] transition-colors">Batik Kombinasi</a></li>
                <li><a href="/product?category=Aksesoris" className="hover:text-[#bef264] transition-colors">Accessories</a></li>
              </ul>
            </div>

            {/* Column 3: COMPANY */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest" style={{ fontFamily: "Consolas, monospace" }}>
                COMPANY
              </h5>
              <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                <li><a href="/about" className="hover:text-[#bef264] transition-colors">About Us</a></li>
                <li><a href="/careers" className="hover:text-[#bef264] transition-colors">Careers</a></li>
                <li><a href="/about" className="hover:text-[#bef264] transition-colors">Press</a></li>
                <li><a href="/about" className="hover:text-[#bef264] transition-colors">Sustainability</a></li>
              </ul>
            </div>

            {/* Column 4: SUPPORT */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest" style={{ fontFamily: "Consolas, monospace" }}>
                SUPPORT
              </h5>
              <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                <li><a href="/contact" className="hover:text-[#bef264] transition-colors">Contact Us</a></li>
                <li><a href="/faq" className="hover:text-[#bef264] transition-colors">FAQs</a></li>
                <li><a href="/contact" className="hover:text-[#bef264] transition-colors">Shipping</a></li>
                <li><a href="/contact" className="hover:text-[#bef264] transition-colors">Returns</a></li>
                <li><a href="/size-guide" className="hover:text-[#bef264] transition-colors">Size Guide</a></li>
              </ul>
            </div>

            {/* Column 5: LEGAL */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest" style={{ fontFamily: "Consolas, monospace" }}>
                LEGAL
              </h5>
              <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                <li><a href="#" className="hover:text-[#bef264] transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#bef264] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#bef264] transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Built by */}
          <div className="pt-8 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <span 
              className="text-xs text-zinc-600 font-semibold"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              © 2026 BERAKIT SERIES. All rights reserved.
            </span>
            <span 
              className="text-xs text-zinc-600 font-semibold"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Designed & Built by <span className="text-[#bef264] font-bold">BERAKIT SERIES</span>
            </span>
          </div>
        </div>

        {/* Faint Background Watermark */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none select-none overflow-hidden z-0">
          <span 
            className="text-[18vw] font-black text-white/[0.012] tracking-widest leading-none uppercase" 
            style={{ fontFamily: "'Oswald', Impact, sans-serif" }}
          >
            BERAKIT
          </span>
        </div>
      </footer>
    </div>
  );
}
