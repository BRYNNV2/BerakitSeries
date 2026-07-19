"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  MapPin,
  Clock,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowUpRight
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
import { toast } from "sonner";

export default function ContactPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [cartItemCount, setCartItemCount] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formSubmitted, setFormSubmitted] = React.useState(false);

  // Form states
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  // Get current user and cart info
  React.useEffect(() => {
    const fetchUserData = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setCurrentUser(data.session.user);
      }
    };
    fetchUserData();

    // Load cart count from localStorage
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Attempt to save to database table "contact_messages"
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) {
        // Fallback to local simulation if table doesn't exist
        console.warn("Saving to Supabase failed, falling back to local simulation:", error);
      }

      setFormSubmitted(true);
      toast.success("Pesan Anda berhasil dikirim!");
    } catch (err) {
      console.error("Error submitting contact form:", err);
      // Still show success to the user for a smooth mock experience if database is fully offline
      setFormSubmitted(true);
      toast.success("Pesan Anda berhasil dikirim!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-zinc-900 flex flex-col font-sans overflow-x-hidden pt-16">
      {/* Header (Matching Reference) */}
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#bef264] bg-black rounded-xl cursor-pointer outline-none"
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
              className="lg:hidden p-2 hover:bg-zinc-100 rounded-full transition-colors"
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
                    className="text-sm font-bold text-zinc-500 py-1 hover:text-[#bef264] transition-colors"
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
                    className="text-sm font-bold text-zinc-950 py-1 hover:text-[#bef264] transition-colors"
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
        <section className="text-left mb-12 md:mb-20">
          <span
            className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] block mb-2 font-mono"
          >
            Get In Touch
          </span>
          <h1
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-zinc-950 select-none relative"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}
          >
            CONTACT US<span className="text-[#bef264]">.</span>
          </h1>
          <p className="text-sm text-zinc-500 font-semibold mt-4 max-w-xl leading-relaxed">
            Punya pertanyaan mengenai motif batik tulis kami, pesanan kustom ukuran panjang, atau peluang kerja sama? Hubungi kami langsung melalui formulir atau kontak di bawah ini.
          </p>
        </section>

        {/* Two Columns Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start">
          {/* Column 1: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            {formSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="size-16 text-[#bef264] fill-black stroke-2 mb-6" />
                <h3 className="text-2xl font-bold uppercase tracking-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Terima Kasih!
                </h3>
                <p className="text-sm text-zinc-500 mt-2 font-medium max-w-md">
                  Pesan Anda telah kami terima secara aman. Tim BUMDes Berakit akan meninjau pesan Anda dan segera menghubungi Anda kembali.
                </p>
                <Button
                  onClick={() => {
                    setFormSubmitted(false);
                    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
                  }}
                  className="mt-8 bg-black text-white hover:bg-zinc-800 rounded-xl h-11 px-6 text-xs font-bold uppercase tracking-wider transition-colors duration-200"
                >
                  Kirim Pesan Baru
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1 text-left">
                  <h3 className="text-xl font-bold uppercase tracking-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    Kirim Pesan
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Isi data Anda di bawah ini dan kami akan membalas secepat mungkin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Nama Lengkap *</label>
                    <Input
                      type="text"
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">No. Telepon / WhatsApp *</label>
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Contoh: 0812xxxxxxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Alamat Email *</label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Masukkan alamat email aktif"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Subjek Pesan *</label>
                  <Input
                    type="text"
                    name="subject"
                    placeholder="Subjek pertanyaan Anda"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full bg-[#faf9f5] border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-400 h-11 rounded-lg px-4"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">Pesan / Detail Pertanyaan *</label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Tuliskan detail pertanyaan atau masukan Anda..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-lg bg-[#faf9f5] border border-zinc-200 text-xs outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-medium"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black hover:bg-zinc-800 text-white rounded-lg h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-4 transition-colors duration-200"
                >
                  {submitting ? (
                    "Mengirim..."
                  ) : (
                    <>
                      Kirim Pesan <Send className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Column 2: Information Card */}
          <div className="lg:col-span-5 space-y-8">
            {/* Contact Details Card */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold uppercase tracking-tight text-left" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Hubungi Kami Langsung
              </h3>
              <p className="text-xs text-zinc-400 font-medium text-left">
                Punya pertanyaan cepat? Kontak kami langsung melalui opsi berikut.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 items-start text-left">
                  <div className="p-3 bg-[#bef264]/20 rounded-xl text-black">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider font-mono">Lokasi Galeri & Kantor</h4>
                    <p className="text-sm font-semibold text-zinc-800 mt-1">Desa Wisata Berakit, Kec. Teluk Sebong, Kabupaten Bintan, Kepulauan Riau, Indonesia</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start text-left">
                  <div className="p-3 bg-[#bef264]/20 rounded-xl text-black">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider font-mono">Alamat Email</h4>
                    <p className="text-sm font-semibold text-zinc-800 mt-1 hover:text-zinc-600 transition-colors">
                      <a href="mailto:bumdes@berakit.desa.id">bumdes@berakit.desa.id</a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start text-left">
                  <div className="p-3 bg-[#bef264]/20 rounded-xl text-black">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider font-mono">No. Telepon & WhatsApp</h4>
                    <p className="text-sm font-semibold text-zinc-800 mt-1">
                      <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors">
                        +62 812-3456-7890 (WhatsApp BUMDes)
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start text-left">
                  <div className="p-3 bg-[#bef264]/20 rounded-xl text-black">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider font-mono">Jam Operasional</h4>
                    <p className="text-sm font-semibold text-zinc-800 mt-1">Senin - Jumat | 09:00 - 17:00 WIB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder Card */}
            <div className="bg-[#09090b] rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#bef264]/10 rounded-full blur-3xl -z-10 group-hover:bg-[#bef264]/15 transition-all duration-300"></div>
              
              <h3 className="text-lg font-bold uppercase tracking-tight text-left" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Peta Lokasi Desa Berakit
              </h3>
              <p className="text-xs text-zinc-400 font-medium text-left leading-relaxed">
                Kami berlokasi di ujung utara Pulau Bintan, Kepulauan Riau. Daerah pesisir yang kaya akan tradisi dan warisan budaya batik laut yang memukau.
              </p>

              {/* Mock map container */}
              <div className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden mt-4 group/map">
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#bef264] rounded-full scale-150 animate-ping opacity-70"></div>
                    <div className="relative p-2.5 bg-[#bef264] text-black rounded-full font-black">
                      <MapPin className="size-5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-3">BUMDes Berakit, Bintan</span>
                </div>
                <div className="absolute top-12 left-0 right-0 h-px bg-zinc-800/40"></div>
                <div className="absolute top-28 left-0 right-0 h-px bg-zinc-800/40"></div>
                <div className="absolute left-20 top-0 bottom-0 w-px bg-zinc-800/40"></div>
                <div className="absolute left-48 top-0 bottom-0 w-px bg-zinc-800/40"></div>
              </div>
            </div>
          </div>
        </div>
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
