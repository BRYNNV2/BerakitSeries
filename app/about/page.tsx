"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  Heart,
  Award,
  Users,
  Leaf,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { gsap } from "gsap";

export default function AboutPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

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
                console.warn("Failed fetching profile role on about mount:", err);
              }
            }
            setCurrentUser({ ...session.user, role: role || "buyer" });
          }
        } catch (e) {
          console.warn("Failed fetching session in about page:", e);
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

  // GSAP animations
  const heroTextRef = React.useRef<HTMLDivElement>(null);
  const storyRef = React.useRef<HTMLDivElement>(null);
  const statsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Hero anims
    gsap.fromTo(
      heroTextRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f5] text-zinc-900 flex flex-col font-sans">
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
            {[
              { label: "Collections", href: "/product" },
              { label: "New Arrivals", href: "/product?sort=newest" },
              { label: "Gallery", href: "/gallery" },
              { label: "About Us", href: "/about" },
              { label: "Why Us", href: "/#profil" },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className={`relative transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out ${
                  link.href === "/about" ? "opacity-100 after:w-full" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: link.href === "/about" ? 900 : 700,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "lab(2.75381 0 0)",
                }}
              >
                {link.label}
              </a>
            ))}
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
            <nav className="flex flex-col gap-6">
              {[
                { label: "Collections", href: "/product" },
                { label: "New Arrivals", href: "/product?sort=newest" },
                { label: "Gallery", href: "/gallery" },
                { label: "About Us", href: "/about" },
                { label: "Why Us", href: "/#profil" },
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="text-lg font-bold transition-colors hover:text-black py-2 border-b border-zinc-100"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "lab(2.75381 0 0)" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
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

      {/* Main content */}
      <main className="flex-grow pt-24 pb-20">
        {/* Hero Section */}
        <section className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-10" ref={heroTextRef}>
          <div className="space-y-2 mb-10 text-left">
            <span
              className="text-[11px] font-bold tracking-widest text-[#94a3b8] uppercase block"
              style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
            >
              ABOUT US
            </span>
            <h1
              className="uppercase tracking-tight text-black text-4xl sm:text-5xl lg:text-7xl font-black leading-none"
              style={{ fontFamily: "var(--font-oswald), sans-serif" }}
            >
              CRAFTED BY NATURE,<br />CURATED FOR MODERNITY<span className="text-[#bef264]">.</span>
            </h1>
          </div>

          {/* Banner Image */}
          <div className="w-full h-[40vh] sm:h-[50vh] lg:h-[60vh] rounded-[24px] sm:rounded-[32px] overflow-hidden relative shadow-lg mb-16 border border-zinc-200/40">
            <img
              src="https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=1600&auto=format&fit=crop&q=80"
              alt="Batik Artistry"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 sm:p-12">
              <div className="text-left text-white max-w-xl">
                <span className="text-xs font-bold uppercase tracking-widest text-[#bef264] block mb-2 font-mono">ESTABLISHED 2026</span>
                <p className="text-base sm:text-lg font-bold leading-relaxed uppercase tracking-tight" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                  Bringing the timeless coastal heritage of Berakit Village to the forefront of contemporary digital lifestyle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Mission & Story */}
        <section className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start" ref={storyRef}>
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">OUR MISSION</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 uppercase leading-none" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              Empowering local artisans & preserving marine heritage.
            </h2>
            <div className="w-20 h-1 bg-[#bef264]" />
            <p className="text-zinc-600 text-sm leading-relaxed font-normal">
              Batik Berakit bukan sekadar kain, melainkan media narasi tentang keindahan alam pesisir Kepulauan Riau. Diinisiasi oleh Badan Usaha Milik Desa (BUMDes) Desa Berakit, kami melestarikan tradisi seni canting kuno sekaligus membuka gerbang ekonomi kreatif digital bagi masyarakat lokal.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
            <div className="bg-white border border-zinc-200/80 p-8 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-zinc-200/30 transition-all duration-300">
              <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-800 border border-zinc-200/50">
                <Leaf className="size-5" />
              </div>
              <h3 className="font-extrabold uppercase text-lg text-zinc-900" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                100% Pewarnaan Alami
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Kami berkomitmen menjaga kelestarian lingkungan dengan memanfaatkan ekstrak tumbuhan pesisir alami sebagai bahan pewarna dasar kain batik kami.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/80 p-8 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-zinc-200/30 transition-all duration-300">
              <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-800 border border-zinc-200/50">
                <Users className="size-5" />
              </div>
              <h3 className="font-extrabold uppercase text-lg text-zinc-900" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                Komunitas Berdaya
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Setiap lembar kain merupakan kontribusi nyata dalam menyejahterakan kelompok perajin batik lokal, yang sebagian besar adalah perempuan pesisir Berakit.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/80 p-8 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-zinc-200/30 transition-all duration-300">
              <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-800 border border-zinc-200/50">
                <Heart className="size-5" />
              </div>
              <h3 className="font-extrabold uppercase text-lg text-zinc-900" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                Motif Khas Biota Laut
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Terinspirasi langsung dari biota samudra sekitar Bintan Utara: motif mangrove, cangkang gonggong, terumbu karang, dan garis pantai berpasir putih.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/80 p-8 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-zinc-200/30 transition-all duration-300">
              <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-800 border border-zinc-200/50">
                <Award className="size-5" />
              </div>
              <h3 className="font-extrabold uppercase text-lg text-zinc-900" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                Kualitas Premium
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Menggunakan bahan katun premium dan sutra terbaik untuk memastikan kenyamanan bernapas pada kain serta ketahanan warna yang luar biasa.
              </p>
            </div>
          </div>
        </section>

        {/* Our Techniques & Process */}
        <section className="w-full bg-zinc-950 text-white py-20 mt-16">
          <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 text-left space-y-16">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">OUR TECHNIQUES</span>
              <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                Handcrafted With Devotion<span className="text-[#bef264]">.</span>
              </h2>
              <p className="text-zinc-400 text-sm max-w-xl font-medium leading-relaxed">
                Kami melestarikan tiga metode pembatikan tradisional Indonesia untuk memberikan variasi karakteristik tekstur dan visual kain yang khas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
              {/* Card 1 */}
              <div className="space-y-4 group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img
                    src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"
                    alt="Batik Tulis"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    HAND-DRAWN
                  </div>
                </div>
                <h3 className="text-xl font-extrabold uppercase pt-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Batik Tulis</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Mahakarya eksklusif yang dilukis secara manual titik demi titik menggunakan lilin malam cair dan alat canting tradisional. Setiap kain membutuhkan waktu berminggu-minggu dan menghasilkan karya unik yang tiada duanya di dunia.
                </p>
              </div>

              {/* Card 2 */}
              <div className="space-y-4 group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img
                    src="https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=600&auto=format&fit=crop&q=80"
                    alt="Batik Cap"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    HAND-STAMPED
                  </div>
                </div>
                <h3 className="text-xl font-extrabold uppercase pt-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Batik Cap</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Menggunakan blok tembaga khusus bermotif rapi yang ditekan manual ke atas kain. Teknik ini menghasilkan presisi pola geometris biota laut yang cantik dengan waktu pengerjaan yang lebih efisien bagi perajin.
                </p>
              </div>

              {/* Card 3 */}
              <div className="space-y-4 group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img
                    src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&auto=format&fit=crop&q=80"
                    alt="Batik Kombinasi"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    HYBRID TECHNIQUE
                  </div>
                </div>
                <h3 className="text-xl font-extrabold uppercase pt-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Batik Kombinasi</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Gabungan harmonis antara keindahan ekspresif coretan batik tulis dan keteraturan motif batik cap. Memberikan kedalaman tekstur visual yang kaya dan tampilan kain kontemporer yang sangat berkarakter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics or Community Highlights */}
        <section className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-20 text-center" ref={statsRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 bg-white border border-zinc-200/80 rounded-[32px] p-8 sm:p-12 shadow-sm">
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black text-black block" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>30+</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">Local Artisans</span>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black text-black block" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>100%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">Organic Colors</span>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black text-black block" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>500+</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">Masterpieces Sold</span>
            </div>
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black text-[#bef264] block" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>1</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">Berakit Heritage</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Matching Reference) */}
      <footer className="w-full bg-[#09090b] text-white pt-16 pb-8 border-t border-zinc-900 relative z-10">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
          {/* Top footer row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start text-left">
            {/* Column 1: Logo & Tagline */}
            <div className="space-y-4 md:col-span-1">
              <span
                className="uppercase tracking-normal font-black text-2xl"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                BERAKIT SERIES.
              </span>
              <p
                className="text-xs text-zinc-500 leading-relaxed font-semibold max-w-[240px]"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Eksplorasi mahakarya kain batik tulis pesisir Berakit. Elevate Your Style in Every Reality.
              </p>
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
                <li><a href="/about" className="hover:text-[#bef264] transition-colors">Careers</a></li>
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
                <li><a href="mailto:mfyansah@student.umrah.ac.id" className="hover:text-[#bef264] transition-colors">Contact Us</a></li>
                <li><a href="/#faq-section" className="hover:text-[#bef264] transition-colors">FAQs</a></li>
                <li><a href="/#faq-section" className="hover:text-[#bef264] transition-colors">Shipping</a></li>
                <li><a href="/#faq-section" className="hover:text-[#bef264] transition-colors">Returns</a></li>
                <li><a href="/#faq-section" className="hover:text-[#bef264] transition-colors">Size Guide</a></li>
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
          <div className="pt-8 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
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
      </footer>
    </div>
  );
}
