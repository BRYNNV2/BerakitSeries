"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Phone,
  MapPin,
  Info,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  X,
  CreditCard,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function StorefrontPage() {
  const router = useRouter();

  // Storefront state
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Semua");

  // Cart state
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  // Checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("COD");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);
  const [lastCreatedOrderId, setLastCreatedOrderId] = React.useState("");

  // BUMDes config (loaded from settings / fallbacks)
  const [bumdesInfo, setBumdesInfo] = React.useState({
    name: "BUMDes Berakit Maju",
    phone: "081234567890",
    address: "Desa Berakit, RT 02 / RW 01, Kecamatan Teluk Sebong, Bintan",
    bankName: "Bank Riau Kepri Syariah",
    bankAccount: "102-09-08765",
    bankHolder: "BUMDES BERAKIT SEJAHTERA",
    shippingRate: 15000,
  });

  // Load Products & Config
  const loadStoreData = React.useCallback(async () => {
    setLoading(true);
    let dbProducts: Product[] = [];

    // Load Products
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length > 0) {
          dbProducts = data;
        }
      } catch (err) {
        console.error("Failed to load products from Supabase on storefront:", err);
      }
    }

    if (dbProducts.length === 0) {
      const local = localStorage.getItem("berakit_products");
      if (local) {
        dbProducts = JSON.parse(local);
      } else {
        dbProducts = [
          {
            id: "prod-1",
            name: "Madu Hutan Asli Berakit",
            description: "Madu murni yang diambil langsung dari hutan di sekitar Desa Berakit. Kualitas terjamin tanpa bahan pengawet.",
            price: 85000,
            stock: 24,
            image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80",
            category: "Kuliner",
          },
          {
            id: "prod-2",
            name: "Keripik Gonggong Pedas Manis",
            description: "Keripik khas Kepulauan Riau yang terbuat dari siput gonggong segar dengan bumbu pedas manis karamel.",
            price: 35000,
            stock: 80,
            image_url: "https://images.unsplash.com/photo-1566838803981-aa2f7b09d001?w=500&auto=format&fit=crop&q=80",
            category: "Kuliner",
          },
          {
            id: "prod-3",
            name: "Kerajinan Miniatur Kapal Kayu",
            description: "Miniatur kapal tradisional Melayu yang dirakit dengan tangan oleh pengrajin lokal Desa Berakit menggunakan kayu keras pilihan.",
            price: 250000,
            stock: 5,
            image_url: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop&q=80",
            category: "Kerajinan",
          },
          {
            id: "prod-4",
            name: "Ikan Asin Tenggiri Kering",
            description: "Ikan tenggiri segar tangkapan nelayan Berakit yang diasinkan secara tradisional dan dikeringkan di bawah sinar matahari.",
            price: 65000,
            stock: 12,
            image_url: "https://images.unsplash.com/photo-1511112513418-4f81014e7a63?w=500&auto=format&fit=crop&q=80",
            category: "Hasil Laut",
          },
        ];
      }
    }
    setProducts(dbProducts);

    // Load BUMDes Profil info from settings localstorage if exists
    const localProfile = localStorage.getItem("berakit_bumdes_profile");
    if (localProfile) {
      try {
        const parsed = JSON.parse(localProfile);
        setBumdesInfo((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          phone: parsed.phone || prev.phone,
          address: parsed.address || prev.address,
        }));
      } catch (e) {
        console.error(e);
      }
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: Math.min(Math.max(nextQty, 1), item.product.stock) };
          }
          return item;
        })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error("Harap lengkapi semua kolom formulir.");
      return;
    }

    setIsSubmitting(true);
    const finalAmount = totalCartPrice + (paymentMethod === "COD" ? 0 : bumdesInfo.shippingRate);
    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      address: customerAddress,
      total_amount: finalAmount,
      status: "Pending",
      payment_method: paymentMethod,
    };

    let orderId = "tx-" + Math.random().toString(36).substr(2, 9);
    let successfullySaved = false;

    // 1. Try to save to Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .insert([orderData])
          .select("id")
          .single();

        if (!error && data) {
          orderId = data.id;
          successfullySaved = true;

          // Insert order items
          const itemsToInsert = cart.map((item) => ({
            order_id: orderId,
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          }));

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(itemsToInsert);

          if (itemsError) {
            console.error("Failed to insert order items to Supabase:", itemsError);
          }
        } else {
          console.error("Supabase order insert error:", error);
        }
      } catch (err) {
        console.error("Supabase checkout transaction failed, using local storage:", err);
      }
    }

    // 2. Local fallback if Supabase is offline/errored
    if (!successfullySaved) {
      const localTx = localStorage.getItem("berakit_transactions");
      let currentTx = [];
      if (localTx) {
        try {
          currentTx = JSON.parse(localTx);
        } catch (e) {
          console.error(e);
        }
      }
      const newOrder = {
        id: orderId,
        ...orderData,
        created_at: new Date().toISOString(),
      };
      currentTx.unshift(newOrder);
      localStorage.setItem("berakit_transactions", JSON.stringify(currentTx));
    }

    // Reduce local/database stocks (optional logic for offline demo)
    const updatedProducts = products.map((p) => {
      const cartMatch = cart.find((item) => item.product.id === p.id);
      if (cartMatch) {
        return { ...p, stock: Math.max(p.stock - cartMatch.quantity, 0) };
      }
      return p;
    });
    setProducts(updatedProducts);
    localStorage.setItem("berakit_products", JSON.stringify(updatedProducts));

    setLastCreatedOrderId(orderId);
    setCheckoutSuccess(true);
    setIsSubmitting(false);
  };

  const handleWhatsAppNotify = () => {
    // Generate text message for seller WhatsApp checkout confirmation
    let sellerPhone = bumdesInfo.phone.replace(/\D/g, "");
    if (sellerPhone.startsWith("0")) {
      sellerPhone = "62" + sellerPhone.slice(1);
    }

    const itemsSummary = cart
      .map((item) => `- ${item.product.name} (x${item.quantity}) : Rp ${(item.product.price * item.quantity).toLocaleString("id-ID")}`)
      .join("\n");

    const message = `Halo BUMDes Berakit Maju,\nSaya ingin mengonfirmasi pesanan baru dari website:\n\n*Rincian Pembeli:*\n- Nama: ${customerName}\n- HP: ${customerPhone}\n- Alamat: ${customerAddress}\n\n*Pesanan:*\n${itemsSummary}\n- Ongkos Kirim: Rp ${(paymentMethod === "COD" ? 0 : bumdesInfo.shippingRate).toLocaleString("id-ID")}\n- Total Belanja: *Rp ${(totalCartPrice + (paymentMethod === "COD" ? 0 : bumdesInfo.shippingRate)).toLocaleString("id-ID")}*\n- Metode Bayar: *${paymentMethod}*\n\nMohon untuk segera diproses ya. Terima kasih!`;
    
    const url = `https://api.whatsapp.com/send?phone=${sellerPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    // Reset everything
    setCart([]);
    setIsCheckoutOpen(false);
    setCheckoutSuccess(false);
    setIsCartOpen(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
            <svg viewBox="0 0 24 24" className="size-5 text-white stroke-current fill-none stroke-[2]" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
            </svg>
            <span className="font-bold text-sm tracking-widest text-white uppercase">
              BUMDes Berakit
            </span>
          </div>

          {/* Center Navigation Pill (visible on desktop) */}
          <nav className="hidden md:flex items-center bg-zinc-900/60 border border-white/10 rounded-full px-5 py-1.5 gap-6 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            <a href="#" className="hover:text-white transition-colors">Overview</a>
            <a href="#katalog" className="hover:text-white transition-colors">Katalog Produk</a>
            <a href="#tentang-kami" className="hover:text-white transition-colors">Tentang Kami</a>
            <a href="#hubungi-kami" className="hover:text-white transition-colors">Kontak</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-8 font-bold border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white uppercase tracking-wider"
              onClick={() => router.push("/login")}
            >
              Masuk
            </Button>
            <Button
              className="hidden sm:flex text-[10px] h-8 font-bold bg-white text-black hover:bg-zinc-200 uppercase tracking-wider gap-1 px-3.5 rounded-md"
              onClick={() => router.push("/login")}
            >
              Portal Admin <ChevronRight className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative border border-white/10 bg-white/5 size-8 text-zinc-200 hover:text-white hover:bg-white/10"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="size-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#6e3ff3] text-white text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-between bg-cover bg-center pt-24 pb-12 sm:pb-20 px-4 sm:px-12 border-b border-white/10"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      >
        {/* Semi-transparent dark overlay for premium high contrast readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] -z-10" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col justify-end h-full flex-1 gap-6 text-left">
          <div className="max-w-[850px] space-y-6">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
              The Complete Stack for Smarter Desa Berakit Products
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 max-w-[550px] leading-relaxed">
              Mulai dari madu hutan alami murni, kuliner keripik siput gonggong khas Melayu, hingga miniatur kapal kayu tradisional buatan tangan pengrajin lokal Desa Berakit.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#katalog">
                <Button className="bg-white hover:bg-zinc-200 text-black text-[10px] sm:text-xs px-5 py-4.5 rounded-lg font-bold gap-1 uppercase tracking-wider transition-all">
                  Mulai Belanja <ChevronRight className="size-3.5" />
                </Button>
              </a>
              <Button 
                variant="outline" 
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-[10px] sm:text-xs px-5 py-4.5 rounded-lg font-bold uppercase tracking-wider transition-all"
                onClick={() => {
                  const el = document.getElementById("tentang-kami");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Tentang Kami &gt;
              </Button>
            </div>
          </div>
        </div>

        {/* Partners Footer Row */}
        <div className="container mx-auto px-4 relative z-10 pt-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-12 sm:mt-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span className="text-zinc-500 font-bold">Mitra Resmi BUMDes:</span>
            <span>Kementerian Desa PDTT</span>
            <span className="text-slate-600">/</span>
            <span>Pemerintah Kabupaten Bintan</span>
            <span className="text-slate-600">/</span>
            <span>Dinas Koperasi & UMKM</span>
            <span className="text-slate-600">/</span>
            <span>Kepulauan Riau</span>
          </div>
        </div>
      </section>

      {/* Features summary */}
      <section className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-start gap-3">
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">100% Bahan Alami & Lokal</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Semua produk didatangkan langsung dari alam & pengrajin Desa Berakit.</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-start gap-3">
          <div className="size-8 rounded-lg bg-[#6e3ff3]/10 text-[#aa8ef9] flex items-center justify-center shrink-0">
            <User className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Menyokong Nelayan & UMKM</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Keuntungan penjualan kembali sepenuhnya untuk memajukan perekonomian desa.</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-start gap-3">
          <div className="size-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Bayar Aman COD / Transfer</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Mendukung pembayaran tunai di tempat saat barang sampai atau transfer bank.</p>
          </div>
        </div>
      </section>

      {/* Catalog Search & Grid */}
      <main id="katalog" className="flex-1 container mx-auto px-4 py-10 space-y-6">
        
        {/* Title and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Katalog Produk Desa</h2>
            <p className="text-xs text-zinc-400">Temukan produk kuliner dan kerajinan terbaik</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-zinc-900 border-white/10 text-zinc-200 focus-visible:ring-[#6e3ff3]"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {["Semua", "Kuliner", "Kerajinan", "Hasil Laut"].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 text-[11px] px-3.5 rounded-full ${
                    selectedCategory === cat
                      ? "bg-[#6e3ff3] text-white hover:bg-[#5b2fe0]"
                      : "border-white/10 bg-zinc-900/40 text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="size-8 text-[#6e3ff3] animate-spin" />
            <span className="text-sm text-zinc-400">Memuat produk khas Berakit...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 border border-dashed border-white/10 rounded-2xl bg-white/2">
            Produk tidak ditemukan atau tidak tersedia.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900/50 backdrop-blur-md border border-white/5 hover:border-[#6e3ff3]/30 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 shadow-md hover:shadow-[#6e3ff3]/5"
              >
                {/* Photo container */}
                <div className="relative aspect-4/3 w-full bg-black overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold text-white bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      {p.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 gap-1">
                  <h3 className="font-bold text-sm text-white group-hover:text-[#aa8ef9] transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 h-8 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-medium">Harga</span>
                      <span className="font-extrabold text-sm sm:text-base text-white tabular-nums">
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {p.stock === 0 ? (
                      <Badge variant="destructive" className="h-7 text-[10px] px-2.5">Habis</Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-[#6e3ff3] hover:bg-[#5b2fe0] text-white text-[11px] px-3.5 h-8 rounded-lg gap-1 font-semibold"
                        onClick={() => addToCart(p)}
                      >
                        <Plus className="size-3.5" /> Beli
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-10 mt-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div id="tentang-kami" className="space-y-3 scroll-mt-20">
            <h4 className="font-bold text-sm text-white">Mengenai BUMDes</h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px]">
              Koperasi Usaha Desa Berakit mengelola komoditas lokal hasil laut, kuliner, dan handicraft nelayan Bintan.
            </p>
          </div>
          <div id="hubungi-kami" className="space-y-3 scroll-mt-20">
            <h4 className="font-bold text-sm text-white">Hubungi Pengelola</h4>
            <div className="space-y-1.5 text-xs text-zinc-400">
              <p className="flex items-center gap-2"><Phone className="size-3.5 text-[#aa8ef9]" /> {bumdesInfo.phone} (WhatsApp)</p>
              <p className="flex items-start gap-2 max-w-[320px]"><MapPin className="size-3.5 text-[#aa8ef9] mt-0.5 shrink-0" /> {bumdesInfo.address}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white">Informasi</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Semua transaksi bersifat langsung dan terintegrasi dengan portal WhatsApp desa untuk percepatan respon.
            </p>
            <div className="pt-2">
              <Button
                variant="link"
                className="text-xs text-[#aa8ef9] p-0 hover:text-[#b59dfb]"
                onClick={() => router.push("/login")}
              >
                Log In Admin Panel &rarr;
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/5 text-center text-[10px] text-zinc-500">
          &copy; {new Date().getFullYear()} BUMDes Berakit Maju. Hak Cipta Dilindungi.
        </div>
      </footer>

      {/* Shopping Cart Drawer (Right Slide-out) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />

          {/* Drawer body */}
          <div className="relative w-full max-w-[420px] bg-zinc-900 border-l border-white/10 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-350">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-[#aa8ef9]" />
                <h3 className="font-bold text-sm text-white">Keranjang Belanja</h3>
                <Badge className="bg-[#6e3ff3] text-white text-[10px]">{cartItemCount}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-white" onClick={() => setIsCartOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 py-10">
                  <ShoppingCart className="size-10 text-zinc-600" />
                  <p className="text-xs">Keranjang Anda masih kosong.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3 bg-white/2 border border-white/5 p-3 rounded-xl relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="size-14 object-cover rounded-lg bg-black"
                    />
                    <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
                      <span className="font-bold text-xs text-white block truncate">{item.product.name}</span>
                      <span className="text-[10px] text-zinc-400 block">Rp {item.product.price.toLocaleString("id-ID")}</span>
                      
                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="size-5 rounded border border-white/10 hover:bg-white/5 flex items-center justify-center text-xs text-zinc-300"
                          onClick={() => updateCartQty(item.product.id, -1)}
                        >
                          <Minus className="size-2.5" />
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button
                          className="size-5 rounded border border-white/10 hover:bg-white/5 flex items-center justify-center text-xs text-zinc-300"
                          onClick={() => updateCartQty(item.product.id, 1)}
                        >
                          <Plus className="size-2.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      className="absolute top-3 right-3 text-zinc-500 hover:text-rose-500"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-white/5 bg-black/40 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-zinc-400">Total Harga Barang</span>
                  <span className="font-extrabold text-base text-white">Rp {totalCartPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    className="w-full bg-[#6e3ff3] hover:bg-[#5b2fe0] text-white text-xs font-semibold py-4.5 rounded-lg flex items-center justify-center gap-1.5"
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    Lanjutkan ke Pembayaran <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal Dialog */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setIsCheckoutOpen(false)} />

          {/* Modal Content */}
          <div className="relative w-full max-w-[480px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <ShoppingCart className="size-4 text-[#aa8ef9]" />
                Formulir Checkout Pesanan
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-zinc-400 hover:text-white"
                onClick={() => setIsCheckoutOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Success screen */}
            {checkoutSuccess ? (
              <div className="p-6 flex flex-col items-center justify-center text-center gap-4">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="size-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Pesanan Berhasil Dicatat!</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-[340px] leading-relaxed">
                    Pesanan Anda telah dimasukkan ke database dengan ID: <span className="font-mono text-[#aa8ef9]">{lastCreatedOrderId}</span>.
                  </p>
                </div>
                
                {/* Transfer Bank Instructions */}
                {paymentMethod === "Transfer Bank" && (
                  <div className="w-full bg-black/80 border border-white/5 rounded-xl p-3.5 text-left space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Metode Transfer Bank:</p>
                    <p className="text-xs text-zinc-200 font-semibold">{bumdesInfo.bankName}</p>
                    <p className="text-sm font-extrabold text-white tracking-wider my-1">{bumdesInfo.bankAccount}</p>
                    <p className="text-[10px] text-zinc-400">a.n. {bumdesInfo.bankHolder}</p>
                    <p className="text-[10px] text-amber-400 pt-1 font-medium italic">
                      *Silakan simpan nomor rekening di atas dan lampirkan bukti transfer saat menghubungi WA pengelola.
                    </p>
                  </div>
                )}

                <div className="w-full mt-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-4.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    onClick={handleWhatsAppNotify}
                  >
                    <Phone className="size-3.5 fill-current" /> Hubungi WhatsApp Pengelola &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleCheckout} className="p-4 space-y-4">
                
                {/* Product Summary list */}
                <div className="max-h-[100px] overflow-y-auto space-y-1.5 p-2 rounded-lg bg-black/30 border border-white/5">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center text-[11px] text-zinc-400">
                      <span className="truncate max-w-[240px]">{item.product.name} (x{item.quantity})</span>
                      <span className="font-semibold text-zinc-200">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nama Lengkap Penerima</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                      <Input
                        required
                        placeholder="Masukkan nama lengkap Anda..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="pl-9 h-9 text-xs bg-black border-white/10 text-zinc-200 focus-visible:ring-[#6e3ff3]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nomor WhatsApp / HP</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                      <Input
                        required
                        placeholder="Contoh: 081234567890..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="pl-9 h-9 text-xs bg-black border-white/10 text-zinc-200 focus-visible:ring-[#6e3ff3]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Alamat Pengiriman</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
                      <textarea
                        required
                        placeholder="Nama jalan, RT/RW, Dusun, Desa Berakit..."
                        rows={2}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-black border border-white/10 text-zinc-200 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#6e3ff3] resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Metode Pembayaran</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full h-9 px-2 text-xs rounded-md bg-black border border-white/10 text-zinc-200 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#6e3ff3]"
                      >
                        <option value="COD">Tunai di Tempat (COD)</option>
                        <option value="Transfer Bank">Transfer Bank</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end text-right">
                      <span className="text-[10px] text-zinc-400">Total Pembayaran</span>
                      <span className="font-extrabold text-sm sm:text-base text-white tabular-nums">
                        Rp {(totalCartPrice + (paymentMethod === "COD" ? 0 : bumdesInfo.shippingRate)).toLocaleString("id-ID")}
                      </span>
                      {paymentMethod === "Transfer Bank" && (
                        <span className="text-[8px] text-zinc-500 font-medium">Termasuk Ongkir Rp {bumdesInfo.shippingRate.toLocaleString("id-ID")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-2 border-t border-white/5 flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-400 hover:text-white"
                    onClick={() => setIsCheckoutOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#6e3ff3] hover:bg-[#5b2fe0] text-white text-xs px-4 h-9 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Memproses...
                      </>
                    ) : (
                      "Buat Pesanan & Bayar"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
