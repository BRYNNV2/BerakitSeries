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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { gsap } from "gsap";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AboutSlide {
  id: string;
  title: string;
  caption: string;
  image_url: string;
  order_index?: number;
}

const DEFAULT_SLIDES: AboutSlide[] = [
  {
    id: "slide-1",
    title: "CRAFTED BY NATURE",
    caption: "Bringing the timeless coastal heritage of Berakit Village to the forefront of contemporary digital lifestyle.",
    image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=1600&auto=format&fit=crop&q=80",
    order_index: 1,
  },
  {
    id: "slide-2",
    title: "TRADITIONAL CANTING ART",
    caption: "Meticulously hand-drawn with hot wax by local women artisans, preserving centuries-old wisdom.",
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1600&auto=format&fit=crop&q=80",
    order_index: 2,
  },
  {
    id: "slide-3",
    title: "COMMUNITY EMPOWERMENT",
    caption: "Supporting local cooperatives and establishing sustainable creative careers on the shores of Bintan.",
    image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1600&auto=format&fit=crop&q=80",
    order_index: 3,
  }
];

export default function AboutPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [slides, setSlides] = React.useState<AboutSlide[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = React.useState(0);
  const [categoryImages, setCategoryImages] = React.useState<Record<string, string>>({});

  // Fetch product showcase images for categories
  React.useEffect(() => {
    const fetchCategoryImages = async () => {
      const imagesMap: Record<string, string> = {
        "Batik Tulis": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
        "Batik Cap": "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=600&auto=format&fit=crop&q=80",
        "Batik Kombinasi": "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&auto=format&fit=crop&q=80"
      };

      // Try local cache first
      const cachedProductsStr = localStorage.getItem("berakit_products");
      if (cachedProductsStr) {
        try {
          const cachedProducts = JSON.parse(cachedProductsStr);
          if (Array.isArray(cachedProducts)) {
            const tulisProd = cachedProducts.find(p => p.category === "Batik Tulis");
            const capProd = cachedProducts.find(p => p.category === "Batik Cap");
            const kombiProd = cachedProducts.find(p => p.category === "Batik Kombinasi");
            if (tulisProd?.image_url) imagesMap["Batik Tulis"] = tulisProd.image_url;
            if (capProd?.image_url) imagesMap["Batik Cap"] = capProd.image_url;
            if (kombiProd?.image_url) imagesMap["Batik Kombinasi"] = kombiProd.image_url;
          }
        } catch (e) {
          console.error("Failed parsing cached products:", e);
        }
      }

      if (supabase) {
        try {
          const categoriesToFetch = ["Batik Tulis", "Batik Cap", "Batik Kombinasi"];
          const promises = categoriesToFetch.map(async (cat) => {
            const { data, error } = await supabase
              .from("products")
              .select("image_url")
              .eq("category", cat)
              .eq("is_active", true)
              .limit(1);
            if (!error && data && data[0]?.image_url) {
              return { category: cat, imageUrl: data[0].image_url };
            }
            // fallback if is_active filter fails or doesn't yield results
            const { data: data2 } = await supabase
              .from("products")
              .select("image_url")
              .eq("category", cat)
              .limit(1);
            if (data2 && data2[0]?.image_url) {
              return { category: cat, imageUrl: data2[0].image_url };
            }
            return null;
          });

          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res) {
              imagesMap[res.category] = res.imageUrl;
            }
          });
        } catch (err) {
          console.warn("Failed fetching category products:", err);
        }
      }
      setCategoryImages(imagesMap);
    };
    fetchCategoryImages();
  }, []);

  // Fetch banner slides
  React.useEffect(() => {
    const fetchSlides = async () => {
      // Load fallback first
      const cached = localStorage.getItem("berakit_about_slides_cache");
      let localSlides = DEFAULT_SLIDES;
      if (cached) {
        try {
          localSlides = JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached slides:", e);
        }
      }
      setSlides(localSlides);

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("about_slides")
            .select("*")
            .order("order_index", { ascending: true });
          if (!error && data && data.length > 0) {
            setSlides(data);
            localStorage.setItem("berakit_about_slides_cache", JSON.stringify(data));
          }
        } catch (err) {
          console.warn("Failed fetching slides from Supabase:", err);
        }
      }
    };
    fetchSlides();
  }, []);

  // Slide autoplay interval
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
            <a
              href="/"
              className="relative transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out opacity-60 hover:opacity-100"
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
              className="relative transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out opacity-60 hover:opacity-100"
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
              className="relative transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out opacity-60 hover:opacity-100"
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
                    className="text-sm font-bold text-zinc-950 py-1 hover:text-[#bef264] transition-colors"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About Us
                  </a>
                  <a
                    href="/careers"
                    className="text-sm font-bold text-zinc-500 py-1 hover:text-[#bef264] transition-colors"
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

          {/* Banner Image Slideshow */}
          <div className="w-full h-[45vh] sm:h-[55vh] lg:h-[65vh] rounded-[24px] sm:rounded-[32px] overflow-hidden relative shadow-lg mb-16 border border-zinc-200/40 group bg-zinc-900">
            {slides.map((slide, idx) => {
              const isActive = idx === currentSlideIdx;
              return (
                <div
                  key={slide.id || idx}
                  className={`absolute inset-0 transition-all duration-1000 ease-out transform ${
                    isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"
                  }`}
                >
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-8 sm:p-12">
                    <div className={`text-left text-white max-w-xl transition-all duration-700 delay-200 transform ${isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#bef264] block mb-2 font-mono">ESTABLISHED 2026</span>
                      <p className="text-2xl sm:text-4xl font-extrabold leading-tight uppercase tracking-tight" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
                        {slide.title}
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-2 leading-relaxed">
                        {slide.caption}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Nav Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIdx((prev) => (prev - 1 + slides.length) % slides.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/40 hover:bg-[#bef264] hover:text-black text-white flex items-center justify-center backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/40 hover:bg-[#bef264] hover:text-black text-white flex items-center justify-center backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {slides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlideIdx ? "w-6 bg-[#bef264]" : "w-1.5 bg-white/50 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            )}
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
              <div 
                className="space-y-4 group cursor-pointer"
                onClick={() => router.push("/product?category=Batik%20Tulis")}
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img
                    src={categoryImages["Batik Tulis"] || "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80"}
                    alt="Batik Tulis"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-10">
                    HAND-DRAWN
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-[#bef264] text-black font-bold text-xs uppercase px-4 py-2 rounded-full tracking-wider flex items-center gap-1 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Lihat Koleksi <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-extrabold uppercase pt-2 group-hover:text-[#bef264] transition-colors" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Batik Tulis</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Mahakarya eksklusif yang dilukis secara manual titik demi titik menggunakan lilin malam cair dan alat canting tradisional. Setiap kain membutuhkan waktu berminggu-minggu dan menghasilkan karya unik yang tiada duanya di dunia.
                </p>
              </div>

              {/* Card 2 */}
              <div 
                className="space-y-4 group cursor-pointer"
                onClick={() => router.push("/product?category=Batik%20Cap")}
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img
                    src={categoryImages["Batik Cap"] || "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=600&auto=format&fit=crop&q=80"}
                    alt="Batik Cap"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-10">
                    HAND-STAMPED
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-[#bef264] text-black font-bold text-xs uppercase px-4 py-2 rounded-full tracking-wider flex items-center gap-1 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Lihat Koleksi <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-extrabold uppercase pt-2 group-hover:text-[#bef264] transition-colors" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Batik Cap</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Menggunakan blok tembaga khusus bermotif rapi yang ditekan manual ke atas kain. Teknik ini menghasilkan presisi pola geometris biota laut yang cantik dengan waktu pengerjaan yang lebih efisien bagi perajin.
                </p>
              </div>

              {/* Card 3 */}
              <div 
                className="space-y-4 group cursor-pointer"
                onClick={() => router.push("/product?category=Batik%20Kombinasi")}
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  <img
                    src={categoryImages["Batik Kombinasi"] || "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&auto=format&fit=crop&q=80"}
                    alt="Batik Kombinasi"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-10">
                    HYBRID TECHNIQUE
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-[#bef264] text-black font-bold text-xs uppercase px-4 py-2 rounded-full tracking-wider flex items-center gap-1 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Lihat Koleksi <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-extrabold uppercase pt-2 group-hover:text-[#bef264] transition-colors" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Batik Kombinasi</h3>
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
