"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Briefcase,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  FileText,
  Compass,
  Users,
  Award,
  Leaf,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { gsap } from "gsap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

const OPEN_ROLES: JobRole[] = [
  {
    id: "role-1",
    title: "Batik Motif Designer",
    department: "Creative & Design",
    location: "Desa Berakit, Bintan",
    type: "Full-Time",
    description: "Kembangkan motif batik pesisir baru khas Bintan yang memadukan keindahan bahari dengan estetika modern.",
    requirements: [
      "Menguasai teknik canting batik tradisional & sketsa digital",
      "Memiliki apresiasi mendalam terhadap warisan budaya lokal Bintan",
      "Mampu bekerja kolaboratif dengan kelompok perajin wanita di desa",
      "Menyertakan portfolio motif batik atau ilustrasi tekstil"
    ]
  },
  {
    id: "role-2",
    title: "Digital Marketing & Storyteller",
    department: "Marketing & Sales",
    location: "Hybrid (Bintan / Remote)",
    type: "Full-Time",
    description: "Bagikan dedikasi perajin kami ke dunia luar. Buat konten bercerita (storytelling) premium dan kelola kehadiran digital Berakit Series.",
    requirements: [
      "Pengalaman 2+ tahun dalam Social Media Management & Copywriting",
      "Keahlian fotografi/videografi dasar & pengeditan konten visual mobile",
      "Memiliki empati tinggi untuk menyampaikan kisah sosial perajin lokal",
      "Fasih berbahasa Indonesia & Inggris"
    ]
  },
  {
    id: "role-3",
    title: "Operations & Quality Control Lead",
    department: "Operations",
    location: "Desa Berakit, Bintan",
    type: "Full-Time",
    description: "Kelola alur kerja produksi kain batik, pastikan standar kualitas kain sutra & katun premium terjaga, serta koordinasikan pengemasan.",
    requirements: [
      "Pengalaman dalam manajemen produksi ritel, kriya, atau tekstil",
      "Ketelitian tinggi terhadap detail detail cacat lilin malam atau pewarnaan",
      "Mampu memimpin koordinasi harian kelompok perajin",
      "Domisili atau bersedia menetap di Bintan"
    ]
  }
];

export default function CareersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Form states
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    portfolioLink: "",
    coverLetter: ""
  });

  // Fetch session user
  React.useEffect(() => {
    const fetchUser = async () => {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            let role = session.user.role;
            if (!role) {
              try {
                const { data: pData } = await supabase
                  .from("profiles")
                  .select("role")
                  .eq("id", session.user.id)
                  .single();
                if (pData?.role) role = pData.role;
              } catch (err) {
                console.warn("Failed fetching profile role:", err);
              }
            }
            setCurrentUser({ ...session.user, role: role || "buyer" });
          }
        } catch (e) {
          console.warn("Failed fetching session:", e);
        }
      }
    };
    fetchUser();
  }, []);

  // Fetch cart item count
  React.useEffect(() => {
    const cartData = localStorage.getItem("berakit_cart");
    if (cartData) {
      try {
        const parsed = JSON.parse(cartData);
        setCartItemCount(parsed.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // GSAP animation
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        ".entrance-animate",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Silakan pilih posisi lowongan terlebih dahulu.");
      return;
    }
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Silakan lengkapi nama, email, dan nomor telepon Anda.");
      return;
    }

    setSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setSubmitting(false);
      setFormSubmitted(true);
      toast.success("Lamaran Anda berhasil dikirim! Kami akan menghubungi Anda segera.");
    }, 1500);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#faf9f5] text-zinc-900 flex flex-col font-sans overflow-x-hidden pt-16">
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
              <DropdownMenuTrigger className="flex items-center gap-1 relative transition-all duration-300 opacity-100 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-[#bef264] outline-none cursor-pointer" style={{
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#bef264] bg-black rounded-xl cursor-pointer outline-none"
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
              <DropdownMenuTrigger className="flex items-center gap-1 relative opacity-60 hover:opacity-100 transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] outline-none cursor-pointer" style={{
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-black rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer outline-none"
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
                  color: "lab(7.78201 -0.0000149012 0)",
                  fontSize: "12px",
                  lineHeight: "16px",
                }}
                onClick={() =>
                  router.push(currentUser.role === "admin" ? "/admin" : "/dashboard")
                }
              >
                Dashboard
              </button>
            ) : (
              <button
                className="hidden sm:block uppercase transition-colors duration-200 hover:opacity-80"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  color: "lab(7.78201 -0.0000149012 0)",
                  fontSize: "12px",
                  lineHeight: "16px",
                }}
                onClick={() => router.push("/login")}
              >
                Sign In
              </button>
            )}
            <button
              className="relative text-black hover:opacity-80 transition-opacity"
              onClick={() => router.push("/product")}
            >
              <ShoppingBag className="size-[20px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#bef264] text-black text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden text-black hover:opacity-80 transition-opacity"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="size-[22px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden overflow-hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 w-[80%] max-w-[300px] h-full bg-white p-6 shadow-2xl transition-transform duration-300 flex flex-col justify-between ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center justify-between mb-8">
              <span
                className="uppercase tracking-normal font-black text-xl"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
              >
                BERAKIT SERIES.
              </span>
              <button
                className="text-black hover:opacity-80 transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="size-6" strokeWidth={2.5} style={{ color: "lab(2.75381 0 0)" }} />
              </button>
            </div>
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

              {/* Company Accordion / Nested Items */}
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
                    className="text-sm font-bold text-zinc-500 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About Us
                  </a>
                  <a
                    href="/careers"
                    className="text-sm font-bold text-zinc-955 py-1 hover:text-[#bef264] transition-colors"
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

              {/* Support Accordion / Nested Items */}
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
                    className="text-sm font-bold text-zinc-550 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Size Guide
                  </a>
                </div>
              </div>
            </nav>
          </div>
          <div className="pt-6 border-t border-zinc-100 flex flex-col gap-4">
            {currentUser ? (
              <button
                className="w-full py-3 bg-black text-white font-bold rounded-lg uppercase text-sm tracking-wider hover:bg-zinc-800 transition-colors"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push(currentUser.role === "admin" ? "/admin" : "/dashboard");
                }}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="w-full py-3 bg-black text-white font-bold rounded-lg uppercase text-sm tracking-wider hover:bg-zinc-800 transition-colors"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 pb-24 text-left">
        {/* Page Hero */}
        <section className="pt-16 pb-8 space-y-4">
          <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block entrance-animate">
            WE ARE HIRING
          </span>
          <h1
            className="uppercase tracking-tight text-black text-5xl sm:text-6xl lg:text-7xl font-black leading-none entrance-animate"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            CAREERS<span className="text-[#bef264]">.</span>
          </h1>
          <p className="text-zinc-500 text-sm max-w-xl font-medium leading-relaxed entrance-animate">
            Bergabunglah bersama kami di BUMDes Desa Berakit untuk melestarikan warisan adiluhung kain batik tulis pesisir Bintan sekaligus berinovasi di kancah modern.
          </p>
        </section>

        {/* Core Values Section */}
        <section className="py-12 border-t border-zinc-200 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900" style={{ fontFamily: "'Oswald', sans-serif" }}>
              KENAPA BERGABUNG?
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              Di Berakit Series, kami bukan sekadar memproduksi batik, melainkan membangun ekosistem pemberdayaan desa.
            </p>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#faf9f5] border border-zinc-200 p-6 rounded-2xl flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
              <Compass className="size-8 text-black mb-4 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-bold text-sm uppercase mb-1">Cultural Preservation</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">Menjaga kelestarian motif khas laut Desa Berakit agar tetap hidup.</p>
              </div>
            </div>
            <div className="bg-[#faf9f5] border border-zinc-200 p-6 rounded-2xl flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
              <Users className="size-8 text-black mb-4 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-bold text-sm uppercase mb-1">Local Empowerment</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">Memberdayakan perajin lokal & meningkatkan kesejahteraan BUMDes.</p>
              </div>
            </div>
            <div className="bg-[#faf9f5] border border-zinc-200 p-6 rounded-2xl flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
              <Award className="size-8 text-black mb-4 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-bold text-sm uppercase mb-1">Modern Fusion</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">Memadukan warisan canting lilin malam tradisional dengan presentasi digital.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions Grid */}
        <section className="py-12 border-t border-zinc-200 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Job Cards */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-6" style={{ fontFamily: "'Oswald', sans-serif" }}>
              POSISI TERSEDIA ({OPEN_ROLES.length})
            </h3>
            <div className="space-y-6">
              {OPEN_ROLES.map((role) => (
                <div 
                  key={role.id}
                  className="bg-white border border-zinc-200/80 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4 hover:border-zinc-400 transition-all duration-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">{role.department}</span>
                      <h4 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-zinc-950">{role.title}</h4>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-zinc-100 text-zinc-800 text-[9px] font-bold uppercase tracking-widest border-none hover:bg-zinc-100 flex items-center gap-1"><MapPin className="size-2.5" />{role.location}</Badge>
                      <Badge className="bg-[#bef264]/20 text-black text-[9px] font-bold uppercase tracking-widest border-none hover:bg-[#bef264]/30 flex items-center gap-1"><Clock className="size-2.5" />{role.type}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">{role.description}</p>
                  
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block font-mono">PERSYARATAN:</span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-600 font-medium">
                      {role.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <Button 
                      disabled
                      className="bg-zinc-100 text-zinc-400 rounded-full text-xs font-bold uppercase tracking-wider px-5 py-2 border-none cursor-not-allowed"
                    >
                      Coming Soon
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Application Form */}
          <div id="apply-form" className="lg:col-span-5">
            <div className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-lg sticky top-24 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  KIRIM LAMARAN ANDA
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Formulir lamaran saat ini dinonaktifkan karena belum ada lowongan aktif yang dibuka.
                </p>
              </div>

              {formSubmitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <CheckCircle2 className="size-16 text-[#bef264] animate-bounce" />
                  <h4 className="text-lg font-bold uppercase tracking-tight">Lamaran Terkirim!</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                    Terima kasih telah mendaftar. Tim rekrutmen BUMDes Desa Berakit akan meninjau berkas Anda dan menghubungi Anda via email segera.
                  </p>
                  <Button 
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({
                        fullName: "",
                        email: "",
                        phone: "",
                        portfolioLink: "",
                        coverLetter: ""
                      });
                      setSelectedRole("");
                    }}
                    className="bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold uppercase tracking-wider px-6 py-2 border-none"
                  >
                    Kirim Lamaran Lain
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4 opacity-60">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Pilih Posisi *</label>
                    <select 
                      disabled
                      name="role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-xs bg-[#faf9f5] outline-none font-medium text-zinc-400 cursor-not-allowed"
                    >
                      <option value="">-- Pilih Lowongan Kerja --</option>
                      {OPEN_ROLES.map((role) => (
                        <option key={role.id} value={role.id}>{role.title} ({role.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Nama Lengkap *</label>
                    <Input 
                      disabled
                      type="text" 
                      name="fullName"
                      placeholder="Masukkan nama lengkap Anda" 
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4 cursor-not-allowed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Alamat Email *</label>
                    <Input 
                      disabled
                      type="email" 
                      name="email"
                      placeholder="nama@email.com" 
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4 cursor-not-allowed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Nomor Telepon / WhatsApp *</label>
                    <Input 
                      disabled
                      type="tel" 
                      name="phone"
                      placeholder="0812xxxxxxxx" 
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4 cursor-not-allowed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Link Portfolio / CV *</label>
                    <Input 
                      disabled
                      type="url" 
                      name="portfolioLink"
                      placeholder="Google Drive, Dropbox, atau LinkedIn link" 
                      value={formData.portfolioLink}
                      onChange={handleInputChange}
                      className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4 cursor-not-allowed"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Surat Pengantar / Mengapa Anda? *</label>
                    <textarea 
                      disabled
                      name="coverLetter"
                      rows={4}
                      placeholder="Ceritakan minat dan kualifikasi singkat Anda..." 
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-lg bg-[#faf9f5] border border-zinc-200 text-xs outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-medium text-zinc-400 cursor-not-allowed"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled
                    className="w-full bg-zinc-100 text-zinc-400 rounded-lg h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-4 border-none cursor-not-allowed"
                  >
                    Coming Soon
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer 
        className="w-full bg-[#050505] py-16 border-t border-zinc-900 relative z-10 overflow-hidden text-white"
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          {/* Top Grid */}
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
                <li><a href="/contact" className="hover:text-[#bef264] transition-colors">Size Guide</a></li>
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
