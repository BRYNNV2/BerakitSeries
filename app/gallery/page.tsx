"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Maximize2,
  Calendar,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase, withTimeout } from "@/lib/supabase";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  created_at?: string;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Proses Canting Batik Pesisir",
    description: "Perajin lokal menggambar motif biota laut menggunakan lilin malam panas secara teliti di Desa Berakit.",
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    category: "Proses Pembuatan",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "gal-2",
    title: "Pewarnaan Kain Batik",
    description: "Kain batik dicelupkan ke dalam larutan pewarna alami dari tanaman sekitar pesisir Desa Berakit.",
    image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=800&auto=format&fit=crop&q=80",
    category: "Proses Pembuatan",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "gal-3",
    title: "Koleksi Selendang Sutra",
    description: "Keindahan motif ombak samudra pada kain sutra premium hasil karya kelompok perajin batik Berakit.",
    image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80",
    category: "Produk",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "gal-4",
    title: "Pameran Batik Khas Bintan",
    description: "Partisipasi BUMDes Berakit dalam memamerkan produk batik khas di acara festival pariwisata daerah.",
    image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    category: "Acara",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: "gal-5",
    title: "Gotong Royong Perajin",
    description: "Suasana kebersamaan perajin batik di workshop BUMDes Berakit saat merancang motif kolaboratif baru.",
    image_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    category: "Komunitas",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: "gal-6",
    title: "Detail Motif Ombak Pesisir",
    description: "Sentuhan akhir lilin malam pada kain tenun sebelum masuk ke tahap pencelupan warna biru samudra.",
    image_url: "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=800&auto=format&fit=crop&q=80",
    category: "Produk",
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: "gal-7",
    title: "Workshop Canting Remaja",
    description: "Pelatihan membatik untuk generasi muda Desa Berakit guna melestarikan warisan budaya lokal.",
    image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    category: "Komunitas",
    created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
  },
];

const categories = ["Semua", "Proses Pembuatan", "Produk", "Acara", "Komunitas"];

export default function GalleryPage() {
  const router = useRouter();
  const [gallery, setGallery] = React.useState<GalleryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState("Semua");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "az" | "za">("newest");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const hasAnimated = React.useRef(false);

  // Click outside to close sort dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGallery = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;
    const cached = localStorage.getItem("berakit_gallery_cache");
    if (cached) {
      try {
        setGallery(JSON.parse(cached));
        setLoading(false);
      } catch (e) { console.error(e); }
    }
    if (hasCredentials) {
      try {
        const { data, error } = await withTimeout(
          supabase.from("gallery").select("*").order("created_at", { ascending: false })
        );
        if (!error && data) {
          setGallery(data);
          localStorage.setItem("berakit_gallery_cache", JSON.stringify(data));
        }
      } catch (e) {
        console.error("Gagal memuat galeri dari Supabase:", e);
      }
    } else {
      setGallery([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchGallery();
    const cartData = localStorage.getItem("berakit_cart");
    if (cartData) {
      try {
        const parsed = JSON.parse(cartData);
        setCartItemCount(parsed.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      } catch (e) { console.error(e); }
    }
  }, [fetchGallery]);

  // Lenis smooth scroll
  React.useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });
    lenis.on("scroll", () => { ScrollTrigger.update(); });
    const updateRaf = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(updateRaf); lenis.destroy(); };
  }, []);

  const filteredGallery = React.useMemo(() => {
    const filtered = gallery.filter((item) => {
      const matchesCat = selectedCategory === "Semua" || item.category === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "oldest":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "az":
          return a.title.localeCompare(b.title);
        case "za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }, [gallery, selectedCategory, searchQuery, sortBy]);

  // GSAP Entrance reveal animations — runs only once on initial data load
  React.useEffect(() => {
    if (loading || gallery.length === 0 || hasAnimated.current) return;
    hasAnimated.current = true;

    const cards = containerRef.current?.querySelectorAll(".gallery-card");
    const enterEls = document.querySelectorAll(".entrance-animate");

    // Set initial hidden state via GSAP (not React inline styles)
    gsap.set(cards ?? [], { opacity: 0, y: 40, scale: 0.96 });
    gsap.set(enterEls, { opacity: 0, y: 30 });

    // Entrance animation for cards
    gsap.to(cards ?? [], {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      stagger: 0.06,
      ease: "power2.out",
      clearProps: "all"
    });

    // Header entrance — no clearProps so opacity:1 persists through re-renders
    gsap.to(enterEls, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out"
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, gallery]);

  const handlePrevPhoto = () => {
    setActivePhotoIdx((p) => (p === 0 ? filteredGallery.length - 1 : p - 1));
  };
  const handleNextPhoto = () => {
    setActivePhotoIdx((p) => (p === filteredGallery.length - 1 ? 0 : p + 1));
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#faf9f5] text-zinc-900 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 w-full border-b border-zinc-200/50 bg-[#faf9f5]/90 backdrop-blur-md">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <span className="uppercase tracking-normal cursor-pointer select-none" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 900, color: "lab(2.75381 0 0)", fontSize: "clamp(20px, 4vw, 30px)", lineHeight: "clamp(24px, 4vw, 36px)" }} onClick={() => router.push("/")}>
            BERAKIT SERIES.
          </span>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Collections", href: "/product" },
              { label: "New Arrivals", href: "/product" },
              { label: "Gallery", href: "/gallery" },
              { label: "Why Us", href: "/#profil" },
              { label: "News Letter", href: "/#hubungi-kami" },
            ].map((link, idx) => (
              <a key={idx} href={link.href} className={`relative transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out ${link.href === "/gallery" ? "opacity-100 after:w-full" : "opacity-60 hover:opacity-100"}`} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: link.href === "/gallery" ? 900 : 700, fontSize: "14px", lineHeight: "20px", color: "lab(2.75381 0 0)" }}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Expandable Search */}
            <div className="hidden sm:flex items-center relative">
              <div className={`flex items-center overflow-hidden transition-all duration-400 ease-out rounded-full border bg-white ${
                isSearchOpen ? "w-52 border-zinc-300 shadow-sm" : "w-0 border-transparent"
              }`}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 px-3 text-xs bg-transparent outline-none placeholder:text-zinc-400"
                />
              </div>
              <button
                className="text-black hover:opacity-80 transition-opacity ml-1"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 300);
                  else setSearchQuery("");
                }}
              >
                {isSearchOpen ? <X className="size-[18px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} /> : <Search className="size-[18px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />}
              </button>
            </div>
            <button className="hidden sm:block uppercase transition-colors duration-200 hover:opacity-80" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, color: "lab(7.78201 -0.0000149012 0)", fontSize: "12px", lineHeight: "16px" }} onClick={() => router.push("/login")}>Sign In</button>
            <button className="relative text-black hover:opacity-80 transition-opacity" onClick={() => router.push("/product")}>
              <ShoppingBag className="size-[20px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
              {cartItemCount > 0 && (<span className="absolute -top-1.5 -right-1.5 bg-[#bef264] text-black text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">{cartItemCount}</span>)}
            </button>
            <button className="md:hidden text-black hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="size-[22px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute top-0 right-0 w-[80%] max-w-[300px] h-full bg-white p-6 shadow-2xl transition-transform duration-300 flex flex-col justify-between ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
          <div>
            <div className="flex items-center justify-between mb-8">
              <span className="uppercase tracking-normal font-black text-xl" style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}>BERAKIT SERIES.</span>
              <button className="text-black hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}><X className="size-6" strokeWidth={2.5} style={{ color: "lab(2.75381 0 0)" }} /></button>
            </div>
            <nav className="flex flex-col gap-6">
              {[
                { label: "Collections", href: "/product" },
                { label: "New Arrivals", href: "/product" },
                { label: "Gallery", href: "/gallery" },
                { label: "Why Us", href: "/#profil" },
                { label: "News Letter", href: "/#hubungi-kami" },
              ].map((link, idx) => (
                <a key={idx} href={link.href} className="text-lg font-bold transition-colors hover:text-black py-2 border-b border-zinc-100" style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }} onClick={() => setIsMobileMenuOpen(false)}>{link.label}</a>
              ))}
            </nav>
          </div>
          <div className="pt-6 border-t border-zinc-100 flex flex-col gap-4">
            <button className="w-full py-3 bg-black text-white font-bold rounded-lg uppercase text-sm tracking-wider hover:bg-zinc-800 transition-colors" onClick={() => { setIsMobileMenuOpen(false); router.push("/login"); }}>Sign In</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pt-28 pb-8 text-left space-y-4">
        <div className="space-y-1">
          <span
            className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase block entrance-animate"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            THE ARCHIVE
          </span>
          <h1
            className="uppercase tracking-tight text-black text-5xl sm:text-6xl lg:text-7xl font-black leading-none entrance-animate"
            style={{ fontFamily: "var(--font-oswald), sans-serif" }}
          >
            GALLERY<span className="text-[#bef264]">.</span>
          </h1>
        </div>
        <p className="text-zinc-500 text-sm max-w-lg font-medium leading-relaxed entrance-animate">
          Jelajahi galeri arsip dokumentasi BUMDes Desa Berakit. Temukan kisah dedikasi di balik setiap sapuan canting lilin malam, perayaan kebudayaan bahari, serta kebersamaan perajin batik.
        </p>

        {/* Sort Bar with Dropdown List */}
        <div className="w-full flex items-center justify-between border-b border-zinc-200 py-3 entrance-animate relative z-30">
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-black hover:opacity-75 transition-opacity py-1 cursor-pointer"
            >
              <span>Urutkan: {
                sortBy === "newest" ? "Terbaru" :
                sortBy === "oldest" ? "Terlama" :
                sortBy === "az" ? "A — Z" : "Z — A"
              }</span>
              <ChevronDown className={`size-3.5 transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu List */}
            <div className={`absolute left-0 top-full mt-2 w-48 bg-white border border-zinc-200/80 rounded-xl shadow-lg z-30 py-1 transition-all duration-200 origin-top-left ${
              isSortOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}>
              {([
                { value: "newest" as const, label: "Terbaru" },
                { value: "oldest" as const, label: "Terlama" },
                { value: "az" as const, label: "A — Z" },
                { value: "za" as const, label: "Z — A" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                    sortBy === opt.value
                      ? "bg-[#bef264]/20 text-black"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[11px] font-medium text-zinc-400 hidden sm:block">{filteredGallery.length} dokumentasi</span>
        </div>
      </section>

      {/* Gallery Grid */}
      {loading ? (
        <div className="w-full py-40 flex flex-col items-center justify-center gap-4 flex-1">
          <Loader2 className="size-8 animate-spin text-zinc-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Memuat Galeri...</span>
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="w-full max-w-[1200px] mx-auto px-6 py-28 flex flex-col items-center justify-center gap-4 text-center flex-1">
          <ImageIcon className="size-16 text-zinc-300" />
          <h3 className="text-xl font-bold uppercase text-zinc-800" style={{ fontFamily: "'Oswald', sans-serif" }}>Dokumentasi Tidak Ditemukan</h3>
          <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">Tidak ada foto galeri yang cocok dengan filter atau pencarian saat ini.</p>
          <Button onClick={() => { setSelectedCategory("Semua"); setSearchQuery(""); }} className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider mt-2 border-none">Reset Filter</Button>
        </div>
      ) : (
        <section className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pb-20">
          {/* Masonry Pinterest-style: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-5 space-y-3 sm:space-y-5">
            {filteredGallery.map((item, idx) => {
              // Vary heights for masonry effect
              const heights = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/6]", "aspect-[4/3]", "aspect-[3/4]"];
              const h = heights[idx % heights.length];

              return (
                <div
                  key={item.id}
                  className={`gallery-card break-inside-avoid relative ${h} rounded-xl sm:rounded-[20px] overflow-hidden cursor-pointer group bg-zinc-100 border border-zinc-200/50 shadow-sm sm:shadow-md hover:shadow-2xl hover:shadow-zinc-400/30 transition-all duration-500`}
                  style={{ transformStyle: "preserve-3d" }}
                  onClick={() => { setActivePhotoIdx(idx); setLightboxOpen(true); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex flex-col justify-end p-2.5 sm:p-5 text-white">
                    <Badge className="bg-[#bef264] text-black text-[8px] sm:text-[9px] font-extrabold tracking-widest uppercase hover:bg-[#bef264] w-fit mb-1 sm:mb-2 border-none">{item.category}</Badge>
                    <h3 className="font-bold text-[10px] sm:text-base lg:text-lg uppercase leading-tight tracking-tight mb-0.5 sm:mb-1">{item.title}</h3>
                    <p className="hidden sm:block text-zinc-300 text-xs line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                    <div className="hidden sm:flex items-center justify-between pt-2 border-t border-white/10 text-[9px] font-mono tracking-widest text-zinc-400">
                      <span>{item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "DOKUMENTASI"}</span>
                      <span className="flex items-center gap-1 text-[#bef264]">VIEW <Maximize2 className="size-3" /></span>
                    </div>
                    <div className="flex sm:hidden justify-end mt-0.5">
                      <span className="flex items-center gap-0.5 text-[#bef264] text-[8px] font-bold">VIEW <Maximize2 className="size-2.5" /></span>
                    </div>
                  </div>

                  {/* Subtle always-visible bottom label */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-4 group-hover:opacity-0 transition-opacity duration-300">
                    <p className="text-white text-[9px] sm:text-xs font-bold uppercase tracking-wide truncate">{item.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl bg-zinc-950/98 border-zinc-900 text-white rounded-[32px] p-0 overflow-hidden shadow-2xl">
          {filteredGallery[activePhotoIdx] && (
            <div className="grid grid-cols-1 lg:grid-cols-12 relative h-full min-h-[500px]">
              <button onClick={() => setLightboxOpen(false)} className="absolute right-5 top-5 z-50 size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"><X className="size-5" /></button>
              <div className="lg:col-span-8 bg-zinc-900/40 relative flex items-center justify-center min-h-[350px] lg:h-[600px] p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={filteredGallery[activePhotoIdx].image_url} alt={filteredGallery[activePhotoIdx].title} className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" />
                {filteredGallery.length > 1 && (
                  <>
                    <button onClick={handlePrevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/30 border border-white/10 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"><ArrowLeft className="size-5" /></button>
                    <button onClick={handleNextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/30 border border-white/10 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"><ArrowRight className="size-5" /></button>
                  </>
                )}
              </div>
              <div className="lg:col-span-4 p-8 flex flex-col justify-between text-left border-t lg:border-t-0 lg:border-l border-zinc-900 bg-zinc-950">
                <div className="space-y-6">
                  <Badge className="bg-[#bef264] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#bef264] border-none">{filteredGallery[activePhotoIdx].category}</Badge>
                  <div className="space-y-3">
                    <DialogTitle className="text-3xl font-black uppercase tracking-tight text-white leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>{filteredGallery[activePhotoIdx].title}</DialogTitle>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                      <Calendar className="size-3.5" />
                      <span>{filteredGallery[activePhotoIdx].created_at ? new Date(filteredGallery[activePhotoIdx].created_at!).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "DOKUMENTASI DESA"}</span>
                    </div>
                  </div>
                  <div className="h-px bg-zinc-900" />
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">KETERANGAN</span>
                    <DialogDescription className="text-zinc-400 text-sm leading-relaxed font-normal">{filteredGallery[activePhotoIdx].description}</DialogDescription>
                  </div>
                </div>
                <div className="pt-6 border-t border-zinc-900 flex justify-between items-center text-xs font-mono text-zinc-500">
                  <span>BERAKIT SERIES ARCHIVE</span>
                  <span className="text-white font-bold">{activePhotoIdx + 1} / {filteredGallery.length}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
