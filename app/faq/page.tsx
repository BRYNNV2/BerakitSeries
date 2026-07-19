"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Search,
  HelpCircle,
  ArrowRight,
  Package,
  CreditCard,
  Shirt,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "produk" | "pembayaran" | "pengiriman";
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "p1",
    question: "Apakah batik Berakit Series adalah batik tulis asli?",
    answer: "Ya, seluruh koleksi premium kami merupakan batik tulis asli 100% buatan tangan oleh perajin lokal di Desa Wisata Berakit, Bintan. Kami tidak menggunakan mesin cetak/printing untuk menjaga nilai seni dan keaslian warisan budaya.",
    category: "produk",
  },
  {
    id: "p2",
    question: "Bahan kain apa yang digunakan untuk pakaian Berakit Series?",
    answer: "Kami menggunakan bahan katun premium (Katun Primissima) dan sutra pilihan. Karakteristik bahannya halus, sejuk saat dikenakan, menyerap keringat dengan baik, dan sangat nyaman digunakan dalam aktivitas sehari-hari maupun acara formal.",
    category: "produk",
  },
  {
    id: "p3",
    question: "Bagaimana cara merawat pakaian batik tulis agar warnanya tetap awet?",
    answer: "Untuk perawatan optimal, cuci pakaian secara manual menggunakan sabun lerak khusus batik atau sampo bayi. Jangan direndam terlalu lama, jangan disikat, dan cukup diangin-anginkan di tempat teduh tanpa terkena sinar matahari langsung saat menjemur.",
    category: "produk",
  },
  {
    id: "p4",
    question: "Apakah bisa memesan ukuran kustom (custom size)?",
    answer: "Tentu saja! Kami melayani pemesanan dengan ukuran kustom (seperti panjang baju, lingkar dada, atau panjang lengan). Anda dapat menghubungi tim layanan pelanggan kami melalui tombol WhatsApp yang tertera atau lewat formulir Contact Us.",
    category: "produk",
  },
  {
    id: "t1",
    question: "Bagaimana cara melakukan pemesanan di website ini?",
    answer: "Cukup masuk ke halaman Collections, pilih produk batik favorit Anda, tentukan ukuran, lalu masukkan ke keranjang belanja. Klik ikon Keranjang di kanan atas, lakukan checkout, isi formulir pengiriman, dan lakukan pembayaran sesuai instruksi.",
    category: "pembayaran",
  },
  {
    id: "t2",
    question: "Metode pembayaran apa saja yang didukung?",
    answer: "Kami menerima pembayaran melalui Transfer Bank (Bank BRI dan Bank Riau Kepri Syariah). Selain itu, kami juga mendukung metode Bayar di Tempat (COD) untuk area pengiriman tertentu.",
    category: "pembayaran",
  },
  {
    id: "t3",
    question: "Apakah saya harus mengunggah bukti transfer setelah membayar?",
    answer: "Ya. Untuk mempercepat verifikasi pembayaran dan proses pengemasan pesanan Anda, harap unggah foto atau screenshot bukti transfer bank yang valid pada halaman checkout sebelum mengirimkan pesanan.",
    category: "pembayaran",
  },
  {
    id: "k1",
    question: "Berapa lama estimasi pengiriman pesanan saya?",
    answer: "Pengiriman dilakukan langsung dari Kabupaten Bintan. Estimasi pengiriman untuk wilayah Kepulauan Riau & Jakarta adalah 2-4 hari kerja, sedangkan untuk wilayah luar pulau lainnya berkisar antara 3-7 hari kerja tergantung opsi ekspedisi.",
    category: "pengiriman",
  },
  {
    id: "k2",
    question: "Apakah saya bisa menukar produk jika ukurannya tidak pas?",
    answer: "Bisa. Kami memfasilitasi penukaran ukuran (size exchange) maksimal 3 hari setelah pesanan Anda terima. Pastikan tag label masih terpasang rapi, baju belum dicuci, dan belum digunakan. Ongkos kirim penukaran ditanggung sepenuhnya oleh pembeli.",
    category: "pengiriman",
  },
  {
    id: "k3",
    question: "Bagaimana cara melacak pengiriman pesanan saya?",
    answer: "Setiap pesanan yang telah dikirimkan ke kurir akan mendapatkan nomor resi resmi. Nomor resi tersebut akan dikirimkan oleh sistem kami langsung ke nomor WhatsApp yang Anda daftarkan saat melakukan checkout.",
    category: "pengiriman",
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<"all" | "produk" | "pembayaran" | "pengiriman">("all");
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const fetchUserData = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setCurrentUser(data.session.user);
      }
    };
    fetchUserData();

    const updateCartCount = () => {
      const stored = localStorage.getItem("berakit_cart");
      if (stored) {
        try {
          const items = JSON.parse(stored);
          const count = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
          setCartItemCount(count);
        } catch (e) {
          console.error(e);
        }
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFAQs = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#bef264] bg-black rounded-xl cursor-pointer outline-none"
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
                  disabled
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 rounded-xl cursor-not-allowed opacity-50 outline-none"
                >
                  <span>Size Guide</span>
                  <span className="text-[9px] lowercase font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm">soon</span>
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
                    className="text-sm font-bold text-zinc-950 py-1 hover:text-[#bef264] transition-colors"
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
                  <div
                    className="text-sm font-semibold text-zinc-400 py-1 flex items-center justify-between opacity-60"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    <span>Size Guide</span>
                    <span className="text-[8px] lowercase font-mono bg-zinc-100 text-zinc-500 px-1 rounded-sm">soon</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
          <div className="pt-6 border-t border-zinc-100 flex flex-col gap-4">
            {currentUser ? (
              <button
                className="w-full h-11 border border-zinc-300 rounded-xl font-bold uppercase text-xs"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/dashboard");
                }}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="w-full h-11 border border-zinc-300 rounded-xl font-bold uppercase text-xs"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-20 animate-in fade-in duration-500">
        {/* Title / Hero */}
        <section className="text-left mb-12 md:mb-16">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 font-mono">
            Pusat Bantuan
          </span>
          <h1
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-zinc-950 select-none relative"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}
          >
            FAQS<span className="text-[#bef264]">.</span>
          </h1>
          <p className="text-sm text-zinc-500 font-semibold mt-4 max-w-xl leading-relaxed">
            Temukan jawaban atas pertanyaan-pertanyaan yang paling sering diajukan seputar produk batik tulis kami, pemesanan, metode pembayaran, serta kebijakan pengiriman.
          </p>
        </section>

        {/* Search & Category Filter Section */}
        <section className="mb-12 space-y-6">
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari pertanyaan atau jawaban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 bg-white border border-zinc-200 focus:ring-1 focus:ring-zinc-400 h-12 rounded-2xl text-sm font-medium shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600 font-mono"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Categories Tab Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                activeCategory === "all"
                  ? "bg-black border-black text-[#bef264] shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black"
              }`}
            >
              Semua Pertanyaan
            </button>
            <button
              onClick={() => setActiveCategory("produk")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-2 ${
                activeCategory === "produk"
                  ? "bg-black border-black text-[#bef264] shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black"
              }`}
            >
              <Shirt className="size-3.5" /> Produk & Bahan
            </button>
            <button
              onClick={() => setActiveCategory("pembayaran")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-2 ${
                activeCategory === "pembayaran"
                  ? "bg-black border-black text-[#bef264] shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black"
              }`}
            >
              <CreditCard className="size-3.5" /> Pemesanan & Pembayaran
            </button>
            <button
              onClick={() => setActiveCategory("pengiriman")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-2 ${
                activeCategory === "pengiriman"
                  ? "bg-black border-black text-[#bef264] shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black"
              }`}
            >
              <Package className="size-3.5" /> Pengiriman & Kebijakan
            </button>
          </div>
        </section>

        {/* FAQs Accordion Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item) => {
                const isOpen = !!openItems[item.id];
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-zinc-300"
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 outline-none select-none cursor-pointer"
                    >
                      <span
                        className="text-base font-bold text-zinc-950 tracking-tight"
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                      >
                        {item.question}
                      </span>
                      <span
                        className={`shrink-0 p-1 rounded-full bg-zinc-50 text-zinc-600 border border-zinc-200 transition-transform duration-300 ${
                          isOpen ? "rotate-180 bg-zinc-950 text-white border-zinc-950" : ""
                        }`}
                      >
                        <ChevronDown className="size-4" />
                      </span>
                    </button>

                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-[500px] border-t border-zinc-100" : "max-h-0"
                      } overflow-hidden`}
                    >
                      <div className="px-6 py-5 text-sm text-zinc-500 font-medium leading-relaxed bg-zinc-50/30">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center space-y-4">
                <HelpCircle className="size-12 text-zinc-300 mx-auto" />
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Tidak Ada Pertanyaan Ditemukan</h3>
                <p className="text-xs text-zinc-400 font-semibold max-w-md mx-auto">
                  Cobalah kata kunci pencarian yang lain atau ganti filter kategori untuk menemukan pertanyaan yang Anda cari.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="bg-black hover:bg-zinc-800 text-white rounded-xl h-10 px-5 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Reset Pencarian
                </Button>
              </div>
            )}
          </div>

          {/* Help Desk / Contact CTA Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-left">
              <div className="p-3 bg-[#bef264]/20 rounded-2xl text-black inline-block">
                <MessageCircle className="size-6" />
              </div>
              <div className="space-y-2">
                <h3
                  className="text-xl font-bold uppercase tracking-tight text-zinc-950"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  Punya Pertanyaan Lain?
                </h3>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Jika Anda tidak menemukan jawaban yang Anda cari di halaman FAQ ini, tim layanan pelanggan kami siap membantu Anda secara langsung.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => router.push("/contact")}
                  className="w-full bg-black hover:bg-zinc-800 text-white rounded-xl h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  Kirim Pesan Formulir <ArrowRight className="size-3.5" />
                </Button>

                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 rounded-xl h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200"
                >
                  Hubungi Via WhatsApp
                </a>
              </div>
            </div>

            {/* Quick tips box */}
            <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264]/10 rounded-full blur-2xl"></div>
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono">Tips Belanja</h4>
              <h3
                className="text-lg font-bold uppercase tracking-tight mt-2 text-white"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Keaslian Produk Terjamin
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold mt-2">
                Setiap helai kain batik Berakit memiliki ciri khas motif pesisir laut dan dilengkapi dengan sertifikat garansi keaslian langsung dari BUMDes Berakit Maju.
              </p>
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
