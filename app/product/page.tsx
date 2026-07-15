"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  X,
  CreditCard,
  User,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Truck,
  RotateCcw,
  Shield,
  Headphones,
  Star,
  Clock,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Menu,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, withTimeout } from "@/lib/supabase";
import { gsap } from "gsap";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
  created_at?: string;
  has_sizes?: boolean;
  size_variants?: { size: string; price: number; stock: number }[];
  has_custom_length?: boolean;
  price_per_cm?: number;
  min_length_cm?: number;
  selectedSize?: string;
  customLength?: number;
  is_active?: boolean;
}

interface CartItem {
  id?: string;
  product: Product;
  quantity: number;
}

const DEFAULT_PRODUCTS: Product[] = [];

export default function ProductListingPage() {
  const router = useRouter();

  // Core products & loading state
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters, search & sorting
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");

  // Custom sort dropdown state
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cart state
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

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
                console.warn("Failed fetching profile role on product mount:", err);
              }
            }
            setCurrentUser({ ...session.user, role: role || "buyer" });
          }
        } catch (e) {
          console.warn("Failed fetching session in product catalog:", e);
        }
      }
    };
    fetchUser();
  }, []);

  // Quick View dialog state
  const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState("M");
  const [customLength, setCustomLength] = React.useState<number>(100);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.has_sizes && selectedProduct.size_variants && selectedProduct.size_variants.length > 0) {
        setSelectedSize(selectedProduct.size_variants[0].size);
      } else {
        setSelectedSize("M");
      }
      if (selectedProduct.has_custom_length) {
        setCustomLength(selectedProduct.min_length_cm || 100);
      } else {
        setCustomLength(100);
      }
    }
  }, [selectedProduct]);

  const activePrice = React.useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedProduct.has_sizes) {
      const variant = selectedProduct.size_variants?.find((v: any) => v.size === selectedSize);
      return variant ? variant.price : selectedProduct.price;
    }
    if (selectedProduct.has_custom_length) {
      return (selectedProduct.price_per_cm || 0) * customLength;
    }
    return selectedProduct.price;
  }, [selectedProduct, selectedSize, customLength]);

  const activeStock = React.useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedProduct.has_sizes) {
      const variant = selectedProduct.size_variants?.find((v: any) => v.size === selectedSize);
      return variant ? variant.stock : 0;
    }
    return selectedProduct.stock;
  }, [selectedProduct, selectedSize]);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerAddress, setCustomerAddress] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("COD");
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);
  const [lastCreatedOrderId, setLastCreatedOrderId] = React.useState("");

  // Refs for entrance animations
  const headerRef = React.useRef<HTMLElement>(null);
  const titleSectionRef = React.useRef<HTMLDivElement>(null);
  const filterBarRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const hasAnimated = React.useRef(false);

  // Fetch products with SWR (Stale-While-Revalidate) Cache Optimization
  const fetchProducts = React.useCallback(async () => {
    // 1. Try to load from cache immediately to prevent loading lag
    let cachedProducts: Product[] = [];
    const localCache = localStorage.getItem("berakit_products_cache");
    const localCacheTime = localStorage.getItem("berakit_products_cache_time");
    const now = Date.now();
    const isCacheFresh = localCache && localCacheTime && (now - parseInt(localCacheTime, 10) < 5 * 60 * 1000); // 5 mins fresh

    if (localCache) {
      try {
        cachedProducts = JSON.parse(localCache);
        setProducts(cachedProducts);
        // If the cache is still fresh, we can skip showing the loader completely!
        if (isCacheFresh) {
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse local product cache", e);
      }
    }

    // Only show loading spinner if we don't have any cached products at all
    if (cachedProducts.length === 0) {
      setLoading(true);
    }

    const hasCredentials = !!supabase;

    if (hasCredentials) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
        );

        if (error) throw error;

        if (data) {
          setProducts(data);
          // Update Cache
          localStorage.setItem("berakit_products_cache", JSON.stringify(data));
          localStorage.setItem("berakit_products_cache_time", now.toString());
          
          // Sync with general product database
          localStorage.setItem("berakit_products", JSON.stringify(data));
        } else {
          // If Supabase is empty, load from localStorage fallback
          loadLocalStorageProducts();
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to LocalStorage:", err);
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
        } else {
          loadLocalStorageProducts();
        }
      }
    } else {
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      } else {
        loadLocalStorageProducts();
      }
    }
    setLoading(false);
  }, []);

  const loadLocalStorageProducts = () => {
    const local = localStorage.getItem("berakit_products");
    if (local) {
      setProducts(JSON.parse(local));
    } else {
      localStorage.setItem("berakit_products", JSON.stringify(DEFAULT_PRODUCTS));
      setProducts(DEFAULT_PRODUCTS);
    }
  };

  React.useEffect(() => {
    fetchProducts();
    // Parse category from URL query parameters (safe for Next.js static generation)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category");
      if (catParam) {
        setSelectedCategory(catParam);
      }
    }
    // Load cart from localStorage
    const savedCart = localStorage.getItem("berakit_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, [fetchProducts]);

  // Sync cart to localStorage
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("berakit_cart", JSON.stringify(newCart));
  };

  // GSAP Entry Animations — runs only once on initial data load
  React.useEffect(() => {
    if (!loading && products.length > 0 && !hasAnimated.current) {
      const cardEls = document.querySelectorAll(".product-card-animate");
      hasAnimated.current = true;

      // Set initial hidden states via GSAP (not React inline styles)
      gsap.set(headerRef.current, { y: -20, opacity: 0 });
      gsap.set(titleSectionRef.current, { y: 30, opacity: 0 });
      gsap.set(filterBarRef.current, { y: 20, opacity: 0 });

      // Animate in — no clearProps on layout elements so opacity:1 persists through re-renders
      gsap.to(headerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" });
      gsap.to(titleSectionRef.current, { y: 0, opacity: 1, duration: 0.6, delay: 0.1, ease: "power2.out" });
      gsap.to(filterBarRef.current, { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" });

      if (cardEls.length > 0) {
        gsap.set(cardEls, { y: 40, opacity: 0 });
        // Cards keep clearProps so hover transforms are unaffected
        gsap.to(cardEls, { y: 0, opacity: 1, duration: 0.6, delay: 0.3, stagger: 0.08, ease: "power2.out", clearProps: "transform" });
      }
    }
  }, [loading, products]);

  // Filtered & Sorted Products
  const filteredProducts = React.useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sorting
    if (sortBy === "newest") {
      // Default / Keep order or sort by date if available
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Cart operations
  const addToCart = (product: any, quantity = 1, size?: string, length?: number) => {
    let resolvedPrice = product.price;
    let sizeLabel = size || "Standard";
    let maxStock = product.stock;

    if (product.has_sizes && size) {
      const variant = product.size_variants?.find((v: any) => v.size === size);
      if (variant) {
        resolvedPrice = variant.price;
        maxStock = variant.stock;
      }
    } else if (product.has_custom_length && length) {
      resolvedPrice = (product.price_per_cm || 0) * length;
      sizeLabel = `${length} cm`;
      maxStock = Math.floor(product.stock / length) || 1;
    }

    const cartItemId = `${product.id}-${sizeLabel}`;
    const existing = cart.find((item) => item.id === cartItemId);
    
    const cartProduct = {
      ...product,
      price: resolvedPrice,
      selectedSize: sizeLabel,
      customLength: length,
      stock: maxStock
    };

    if (existing) {
      const updated = cart.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: Math.min(item.quantity + quantity, maxStock) }
          : item
      );
      updateCart(updated);
    } else {
      updateCart([...cart, { 
        id: cartItemId, 
        product: cartProduct, 
        quantity: Math.min(quantity, maxStock) 
      }]);
    }
    toast.success(`${product.name} (${sizeLabel}) ditambahkan ke keranjang`);
  };

  const removeFromCart = (cartItemId: string) => {
    const updated = cart.filter((item) => item.id !== cartItemId && item.product.id !== cartItemId);
    updateCart(updated);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === cartItemId || item.product.id === cartItemId) {
          const nextQty = item.quantity + delta;
          return { ...item, quantity: Math.min(Math.max(nextQty, 1), item.product.stock) };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    updateCart(updated);
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Checkout submit
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (paymentMethod === "Transfer" && !receiptFile) {
      toast.error("Harap unggah bukti transfer pembayaran Anda");
      return;
    }

    setIsSubmitting(true);
    const orderId = `BRKT-${Date.now().toString().slice(-6)}`;

    let finalReceiptUrl = null;
    if (paymentMethod === "Transfer" && receiptFile && supabase) {
      try {
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receiptFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);
        finalReceiptUrl = publicUrl;
      } catch (err: any) {
        console.error("Gagal mengunggah bukti transfer ke Supabase:", err);
        toast.error(`Gagal mengunggah bukti transfer: ${err.message || err}`);
        setIsSubmitting(false);
        return;
      }
    }

    // Fetch user if logged in
    let loggedInUserId = null;
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          loggedInUserId = user.id;
        }
      } catch (err) {
        console.warn("Failed fetching user during checkout:", err);
      }
    }

    // Structure transaction object matching public.orders schema
    const orderData = {
      user_id: loggedInUserId,
      customer_name: customerName,
      customer_phone: customerPhone,
      address: customerAddress,
      payment_method: paymentMethod === "Transfer" ? "Transfer Bank" : "COD",
      items: cart.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        selected_size: item.product.selectedSize || null,
      })),
      total_amount: cartSubtotal,
      status: "Pending",
      receipt_url: finalReceiptUrl,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        // Insert into orders table
        const { data, error } = await supabase
          .from("orders")
          .insert([orderData])
          .select();
        if (error) throw error;

        // Deduct stocks in Supabase depending on product model type
        for (const item of cart) {
          if (item.product.has_sizes) {
            const { data: prodData } = await supabase.from("products").select("size_variants").eq("id", item.product.id).single();
            if (prodData) {
              const currentVariants = prodData.size_variants || [];
              const updatedVariants = currentVariants.map((v: any) => {
                if (v.size === item.product.selectedSize) {
                  return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                }
                return v;
              });
              const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
              await supabase.from("products").update({ 
                size_variants: updatedVariants,
                stock: totalStock 
              }).eq("id", item.product.id);
            }
          } else if (item.product.has_custom_length) {
            const { data: prodData } = await supabase.from("products").select("stock").eq("id", item.product.id).single();
            if (prodData) {
              const totalUsedCm = item.quantity * (item.product.customLength || 100);
              const newStock = Math.max(0, prodData.stock - totalUsedCm);
              await supabase.from("products").update({ stock: newStock }).eq("id", item.product.id);
            }
          } else {
            const { data: prodData } = await supabase.from("products").select("stock").eq("id", item.product.id).single();
            if (prodData) {
              const newStock = Math.max(0, prodData.stock - item.quantity);
              await supabase.from("products").update({ stock: newStock }).eq("id", item.product.id);
            }
          }
        }

        const insertedId = data && data[0] ? data[0].id : orderId;
        setLastCreatedOrderId(insertedId);
        setCheckoutSuccess(true);
        updateCart([]); // Clear cart
      } catch (err: any) {
        console.error("Supabase checkout failed:", err);
        toast.error(`Gagal membuat pesanan: ${err.message || err}`);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error("Supabase belum terkonfigurasi. Tidak dapat memproses pesanan.");
      setIsSubmitting(false);
    }
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
    setCheckoutSuccess(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPaymentMethod("COD");
    setReceiptFile(null);
    setReceiptPreview(null);
    fetchProducts(); // Refresh products with updated stocks
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col font-sans overflow-x-hidden relative pt-16">
      {/* Top Banner Navigation */}
      <header ref={headerRef} className="fixed top-0 inset-x-0 z-40 w-full border-b border-zinc-200/50 bg-white/90 backdrop-blur-md">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <span 
            className="uppercase tracking-normal cursor-pointer select-none"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 900,
              color: "lab(2.75381 0 0)",
              fontSize: "clamp(20px, 4vw, 30px)",
              lineHeight: "clamp(24px, 4vw, 36px)"
            }}
            onClick={() => router.push("/")}
          >
            BERAKIT SERIES.
          </span>

          {/* Center Navigation Pill */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Collections", href: "/product" },
              { label: "New Arrivals", href: "/#katalog" },
              { label: "Gallery", href: "/gallery" },
              { label: "Why Us", href: "/#profil" },
              { label: "News Letter", href: "/#hubungi-kami" },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="relative opacity-60 hover:opacity-100 transition-all duration-300 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#bef264] after:transition-all after:duration-300 after:ease-out"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontStyle: "normal",
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "lab(2.75381 0 0)"
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="text-black hover:opacity-80 transition-opacity">
              <Search className="size-[20px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
            </button>
            {currentUser ? (
              <button 
                className="hidden sm:block uppercase transition-colors duration-200 hover:opacity-80"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  color: "lab(7.78201 -0.0000149012 0)",
                  fontSize: "12px",
                  lineHeight: "16px"
                }}
                onClick={() => router.push(currentUser.role === "admin" ? "/admin" : "/dashboard")}
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
                  lineHeight: "16px"
                }}
                onClick={() => router.push("/login")}
              >
                Sign In
              </button>
            )}
            <button
              className="relative text-black hover:opacity-80 transition-opacity"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="size-[20px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#bef264] text-black text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
            {/* Mobile Hamburger Icon */}
            <button 
              className="md:hidden text-black hover:opacity-80 transition-opacity"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="size-[22px]" strokeWidth={2.75} style={{ color: "lab(2.75381 0 0)" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
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
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: "lab(2.75381 0 0)",
                }}
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
                { label: "New Arrivals", href: "/#katalog" },
                { label: "Gallery", href: "/gallery" },
                { label: "Why Us", href: "/#profil" },
                { label: "News Letter", href: "/#hubungi-kami" },
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="text-lg font-bold transition-colors hover:text-black py-2 border-b border-zinc-100"
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: "lab(2.75381 0 0)",
                  }}
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

      {/* Main Content Body */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-10 flex-1">
        
        {/* Title Section (Matching Reference: THE ARCHIVE & EXPLORE COLLECTION) */}
        <div ref={titleSectionRef} className="space-y-1 mb-8 text-left">
          <span 
            className="text-[11px] font-bold tracking-widest text-[#94a3b8] uppercase block"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            THE ARCHIVE
          </span>
          <h1 
            className="uppercase tracking-tight text-black text-4xl sm:text-5xl lg:text-6xl font-black leading-none"
            style={{ fontFamily: "var(--font-oswald), sans-serif" }}
          >
            EXPLORE COLLECTION<span className="text-[#bef264]">.</span>
          </h1>
        </div>

        {/* Filter & Search Bar Container (Matching Reference: Pill bar structure) */}
        <div 
          ref={filterBarRef}
          className="w-full bg-white border border-zinc-200/80 rounded-2xl md:rounded-full p-3 mb-10 flex flex-col md:flex-row items-center gap-4 justify-between shadow-xs relative z-30"
        >
          {/* Category Dropdown (Left side) */}
          <div className="w-full md:w-auto min-w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-auto h-12 px-6 rounded-full border-zinc-200 bg-white text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-colors focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="ALL CATEGORIES" />
              </SelectTrigger>
              <SelectContent className="bg-white border-zinc-200 rounded-xl">
                <SelectItem value="all" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">ALL CATEGORIES</SelectItem>
                <SelectItem value="Batik Mangrove" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">BATIK MANGROVE</SelectItem>
                <SelectItem value="Batik Cap" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">BATIK CAP</SelectItem>
                <SelectItem value="Batik Eco Print" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">BATIK ECO PRINT</SelectItem>
                <SelectItem value="Batik Tulis" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">BATIK TULIS</SelectItem>
                <SelectItem value="Batik Kombinasi" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">BATIK KOMBINASI</SelectItem>
                <SelectItem value="Aksesoris" className="text-xs font-bold uppercase py-2 focus:bg-zinc-50">AKSESORIS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Box (Middle) */}
          <div className="relative w-full md:flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-6 rounded-full border-zinc-200 bg-zinc-50/50 text-sm focus:border-zinc-300 focus:bg-white transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Items count & Sort (Right side) */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono shrink-0">
              {filteredProducts.length} ITEMS
            </span>
            <div className="h-6 w-px bg-zinc-200 hidden md:block" />
            
            {/* Custom Sort Dropdown styled exactly like Image 2 */}
            <div ref={sortRef} className="relative w-full md:w-auto">
              <div 
                className="w-full md:w-auto h-12 px-6 rounded-full border border-zinc-200 bg-white text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-between md:justify-start gap-3 select-none cursor-pointer"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="size-4 text-zinc-500 stroke-current fill-none stroke-[2.5]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />
                  </svg>
                  <span>
                    {sortBy === "newest" && "NEWEST"}
                    {sortBy === "price-low" && "PRICE: L - H"}
                    {sortBy === "price-high" && "PRICE: H - L"}
                  </span>
                </span>
                <span className={`transition-transform duration-300 font-extrabold text-[10px] ${isSortOpen ? "text-[#bef264] rotate-180" : "text-zinc-400"}`}>
                  ▲
                </span>
              </div>

              {/* Dropdown Floating Card */}
              {isSortOpen && (
                <div 
                  className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white border border-zinc-200/60 rounded-[28px] p-3 w-[220px] shadow-xl shadow-zinc-200/50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* Option 1: Newest */}
                  <div 
                    onClick={() => {
                      setSortBy("newest");
                      setIsSortOpen(false);
                    }}
                    className={`p-4 flex flex-col items-start text-left cursor-pointer rounded-[20px] transition-all ${
                      sortBy === "newest" 
                        ? "bg-[#090d16] text-white" 
                        : "text-zinc-600 hover:text-black hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-[11px] tracking-wider font-extrabold leading-tight">NEWEST</span>
                    <span className="text-[11px] tracking-wider font-extrabold leading-tight">ARRIVALS</span>
                  </div>

                  {/* Option 2: Price Low to High */}
                  <div 
                    onClick={() => {
                      setSortBy("price-low");
                      setIsSortOpen(false);
                    }}
                    className={`p-4 flex flex-col items-start text-left cursor-pointer rounded-[20px] transition-all ${
                      sortBy === "price-low" 
                        ? "bg-[#090d16] text-white" 
                        : "text-zinc-600 hover:text-black hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-[11px] tracking-wider font-extrabold leading-tight">PRICE: LOW TO</span>
                    <span className="text-[11px] tracking-wider font-extrabold leading-tight">HIGH</span>
                  </div>

                  {/* Option 3: Price High to Low */}
                  <div 
                    onClick={() => {
                      setSortBy("price-high");
                      setIsSortOpen(false);
                    }}
                    className={`p-4 flex flex-col items-start text-left cursor-pointer rounded-[20px] transition-all ${
                      sortBy === "price-high" 
                        ? "bg-[#090d16] text-white" 
                        : "text-zinc-600 hover:text-black hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-[11px] tracking-wider font-extrabold leading-tight">PRICE: HIGH TO</span>
                    <span className="text-[11px] tracking-wider font-extrabold leading-tight">LOW</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Catalog Grid (Matching Reference: Card structure, Featured Badge, Price align) */}
        {loading ? (
          <div className="w-full py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="size-8 animate-spin text-[#bef264]" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Loading Collections...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="w-full py-32 border border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white text-center px-4">
            <ShoppingBag className="size-12 text-zinc-300" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-800 uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>No Products Found</h3>
              <p className="text-zinc-500 text-sm max-w-sm">We couldn&apos;t find any batik matching your current filters. Try resetting search or selecting a different category.</p>
            </div>
            <Button 
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }} 
              className="bg-black hover:bg-zinc-800 text-white rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider mt-2"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-10">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="product-card-animate group flex flex-col cursor-pointer"
                onClick={() => {
                  setSelectedProduct(product);
                  setIsQuickViewOpen(true);
                }}
              >
                {/* Product Card Image Container */}
                <div className="relative aspect-[4/5] bg-zinc-100 border border-zinc-200/80 rounded-2xl sm:rounded-[28px] overflow-hidden flex items-center justify-center shadow-xs transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-lg group-hover:shadow-zinc-200/50 group-hover:border-zinc-300">
                  {/* Out of Stock or Featured Badge */}
                  <div className="absolute top-2.5 left-2.5 sm:top-5 sm:left-5 z-10">
                    {product.is_active === false || product.stock === 0 ? (
                      <Badge className="bg-rose-500 hover:bg-rose-500 text-white font-extrabold uppercase tracking-widest text-[7px] sm:text-[9px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-none shadow-md">
                        STOK HABIS
                      </Badge>
                    ) : (
                      <Badge className="bg-[#bef264] hover:bg-[#bef264] text-black font-bold uppercase tracking-widest text-[7px] sm:text-[9px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border-none shadow-none">
                        FEATURED
                      </Badge>
                    )}
                  </div>
                  
                  {/* Main Image */}
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  
                  {/* Quick View button — hidden on mobile tap-first UX, shown on hover desktop */}
                  <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] hidden sm:flex items-end justify-center pb-6">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setIsQuickViewOpen(true);
                      }}
                      className="bg-white text-zinc-900 border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md shadow-zinc-200/80 hover:shadow-lg rounded-full px-6 h-11 flex items-center justify-center gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 pointer-events-auto"
                    >
                      <Eye className="size-4 text-zinc-500 stroke-[2.5]" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest leading-none">QUICK VIEW</span>
                    </div>
                  </div>
                </div>

                {/* Info Under Card */}
                <div className="mt-2.5 sm:mt-4 flex flex-col text-left">
                  <div className="flex justify-between items-start gap-1 sm:gap-4">
                    <span 
                      className="font-bold text-[11px] sm:text-base text-zinc-900 uppercase tracking-tight line-clamp-2 sm:line-clamp-1 group-hover:text-black transition-colors leading-tight"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {product.name}
                    </span>
                    <span className="font-bold text-[10px] sm:text-base text-zinc-900 whitespace-nowrap shrink-0">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-1 font-mono">
                    {product.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>



      {/* 1. PRODUCT QUICK VIEW MODAL (DIALOG) */}
      <Dialog open={isQuickViewOpen} onOpenChange={(open) => {
        // Prevent immediate close if click outside is triggered while closing
        if (!isClosing) setIsQuickViewOpen(open);
      }}>
        <DialogContent className="max-w-3xl bg-white border border-white shadow-[0_4px_16px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12),0_40px_80px_-20px_rgba(0,0,0,0.15)] p-0 overflow-hidden rounded-[40px] [&>button]:hidden duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.9] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.95] data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 relative">
              
              {/* Custom Close Button with Spinner Animation on Click/Hover */}
              <div 
                onClick={() => {
                  setIsClosing(true);
                  setTimeout(() => {
                    setIsQuickViewOpen(false);
                    setIsClosing(false);
                  }, 800);
                }}
                className="absolute right-5 top-5 z-50 size-8 rounded-full bg-transparent flex items-center justify-center text-zinc-600 hover:text-black transition-all hover:scale-110 active:scale-90 group/close cursor-pointer"
              >
                {isClosing ? (
                  <svg className="animate-spin size-4 text-[#bef264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <X className="size-5 stroke-[2.5] transition-transform duration-300 group-hover/close:rotate-90" />
                )}
              </div>

              {/* Left Column: Image with light gray bg */}
              <div className="bg-[#f0f0f0] p-10 flex items-center justify-center min-h-[340px]">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  loading="lazy"
                  className="max-h-[320px] max-w-full object-contain"
                />
              </div>

              {/* Right Column: Info */}
              <div className="p-8 flex flex-col justify-center text-left space-y-5 relative">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-1">
                    {/* Category Label (plain bright lime/green text as in reference image) */}
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#bef264]">
                      {selectedProduct.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 mr-10">
                      STOCK: {selectedProduct.is_active === false 
                        ? 0 
                        : (selectedProduct.has_sizes 
                          ? activeStock 
                          : selectedProduct.has_custom_length 
                            ? `${(selectedProduct.stock / 100).toFixed(1)} m`
                            : selectedProduct.stock)}
                    </span>
                  </div>
                  
                  {/* Title (Oswald/Inter bold condensed uppercase) */}
                  <DialogTitle 
                    className="text-4xl font-black uppercase text-zinc-950 leading-[1.05] tracking-tight mb-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {selectedProduct.name}
                  </DialogTitle>
                  
                  {/* Price */}
                  <span className="text-[22px] font-black text-zinc-950 block">
                    Rp {activePrice.toLocaleString("id-ID")}
                  </span>

                  {/* Horizontal Divider (matching final reference image) */}
                  <div className="w-full h-px bg-zinc-200/60 my-4" />
                  
                  {/* Description */}
                  <DialogDescription className="text-zinc-500 text-xs leading-relaxed font-medium max-w-xs mt-1">
                    {selectedProduct.description}
                  </DialogDescription>
                </div>

                {/* Dynamic Size Selector / CM Length selection */}
                {selectedProduct.has_sizes && selectedProduct.size_variants && selectedProduct.size_variants.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 mb-3">
                      <span>PILIH UKURAN</span>
                      <span className="underline cursor-pointer text-zinc-400 hover:text-zinc-600 transition-colors">PANDUAN UKURAN</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.size_variants.map((v: any) => (
                        <div
                          key={v.size}
                          onClick={() => {
                            if (v.stock > 0) setSelectedSize(v.size);
                          }}
                          className={`h-11 px-4 rounded-full text-xs font-extrabold transition-all duration-300 border flex items-center justify-center cursor-pointer select-none ${
                            v.stock === 0
                              ? "bg-zinc-50 text-zinc-300 border-zinc-100 line-through cursor-not-allowed"
                              : selectedSize === v.size
                                ? "bg-[#bef264] text-black border-transparent shadow-md shadow-[#bef264]/40 scale-105"
                                : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                          }`}
                        >
                          {v.size}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CM Length selection for fabrics */}
                {selectedProduct.has_custom_length && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-zinc-900">
                      <span>PANJANG KAIN (CENTIMETER)</span>
                      <span className="text-zinc-400 font-mono">Rp {(selectedProduct.price_per_cm || 0).toLocaleString("id-ID")}/cm</span>
                    </div>
                    
                    {/* Centimeter Input Control */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="size-10 rounded-full border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all select-none bg-white"
                        onClick={() => setCustomLength(Math.max((selectedProduct.min_length_cm || 100), customLength - 10))}
                      >
                        -10
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min={selectedProduct.min_length_cm || 100}
                          max={selectedProduct.stock}
                          value={customLength}
                          onChange={(e) => {
                            const val = Math.max((selectedProduct.min_length_cm || 100), Number(e.target.value));
                            setCustomLength(Math.min(val, selectedProduct.stock));
                          }}
                          className="w-full h-11 border border-zinc-200 rounded-full px-5 text-center text-sm font-extrabold text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors bg-white"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">cm</span>
                      </div>
                      <button
                        type="button"
                        className="size-10 rounded-full border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer active:scale-95 transition-all select-none bg-white"
                        onClick={() => setCustomLength(Math.min(selectedProduct.stock, customLength + 10))}
                      >
                        +10
                      </button>
                    </div>

                    {/* Quick length presets */}
                    <div className="flex gap-2">
                      {[100, 150, 200, 250].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCustomLength(Math.max((selectedProduct.min_length_cm || 100), Math.min(selectedProduct.stock, preset)))}
                          className={`flex-1 py-1.5 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                            customLength === preset
                              ? "bg-zinc-950 text-white border-transparent"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          {preset === 100 ? "1 Meter" : `${(preset / 100).toFixed(1)} Meter`}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 block text-left leading-normal">
                      * Minimal pembelian: {selectedProduct.min_length_cm || 100} cm ({(selectedProduct.min_length_cm || 100) / 100} meter).
                    </span>
                  </div>
                )}

                {/* Bottom Buttons (exactly matching reference image layout) */}
                <div className="flex gap-3 pt-2">
                  {(((selectedProduct.has_sizes && activeStock > 0) || (!selectedProduct.has_sizes && selectedProduct.stock > 0)) && selectedProduct.is_active !== false) ? (
                    <>
                      {/* CART Button (Lime green) */}
                      <button
                        onClick={() => {
                          addToCart(
                            selectedProduct, 
                            1, 
                            selectedProduct.has_sizes ? selectedSize : undefined,
                            selectedProduct.has_custom_length ? customLength : undefined
                          );
                          setIsQuickViewOpen(false);
                          setIsCartOpen(true);
                        }}
                        className="flex-1 h-12 bg-[#bef264] hover:bg-[#b2e658] text-black font-extrabold rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#bef264]/10 hover:shadow-[#bef264]/20 cursor-pointer border-none"
                      >
                        <ShoppingBag className="size-4 fill-current stroke-[2]" />
                        <span>CART</span>
                      </button>

                      {/* BUY NOW Button (Black) */}
                      <button
                        onClick={() => {
                          addToCart(
                            selectedProduct, 
                            1, 
                            selectedProduct.has_sizes ? selectedSize : undefined,
                            selectedProduct.has_custom_length ? customLength : undefined
                          );
                          setIsQuickViewOpen(false);
                          setIsCheckoutOpen(true);
                        }}
                        className="flex-1 h-12 bg-black hover:bg-zinc-800 text-white font-extrabold rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-black/10 hover:shadow-black/20 cursor-pointer border-none"
                      >
                        <svg viewBox="0 0 24 24" className="size-4 fill-current stroke-none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>BUY NOW</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-zinc-100 text-zinc-400 font-bold rounded-full h-12 uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-not-allowed border-none"
                    >
                      STOK HABIS
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. SHOPPING CART DRAWER (RIGHT SLIDE-OUT) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-2xl transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsCartOpen(false)}
      >
        <div 
          className={`absolute top-0 right-0 w-full sm:w-[420px] h-full bg-white text-zinc-900 shadow-[-8px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cart Header */}
          <div className="px-7 py-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                YOUR CART
              </span>
              <span className="text-[#bef264] font-black text-xl">
                ({cartItemCount})
              </span>
            </div>
            <button 
              className="text-zinc-400 hover:text-zinc-900 transition-colors p-1"
              onClick={() => setIsCartOpen(false)}
            >
              <X className="size-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
                <div className="size-16 rounded-full bg-zinc-100 flex items-center justify-center">
                  <ShoppingBag className="size-7 text-zinc-400 stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-zinc-800 text-base">Cart is Empty</p>
                  <p className="text-sm text-zinc-400 max-w-[260px] leading-relaxed">Looks like you haven&apos;t added anything yet.</p>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {cart.map((item) => (
                  <div 
                    key={item.id || item.product.id}
                    className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex gap-4 items-center animate-in fade-in duration-200"
                  >
                    <div className="size-16 rounded-xl bg-white border border-zinc-100 p-2 shrink-0 flex items-center justify-center">
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name} 
                        loading="lazy"
                        className="max-h-full max-w-full object-contain" 
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h5 className="font-bold text-sm text-zinc-900 line-clamp-1 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {item.product.name}
                      </h5>
                      <div className="flex flex-wrap gap-1.5 items-center mt-0.5">
                        <span className="text-[10px] font-extrabold text-[#bef264] uppercase tracking-widest">
                          {item.product.category}
                        </span>
                        {item.product.selectedSize && (
                          <span className="text-[9px] bg-zinc-200/60 text-zinc-700 px-2 py-0.5 rounded-full font-bold uppercase">
                            Ukuran: {item.product.selectedSize}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-xs text-zinc-700">
                          Rp {item.product.price.toLocaleString("id-ID")}
                        </span>
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-2 py-1">
                          <button 
                            className="text-zinc-400 hover:text-zinc-900 p-0.5 transition-colors cursor-pointer"
                            onClick={() => updateQuantity(item.id || item.product.id, -1)}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-xs font-bold px-1.5 text-zinc-900">{item.quantity}</span>
                          <button 
                            className="text-zinc-400 hover:text-zinc-900 p-0.5 transition-colors cursor-pointer"
                            onClick={() => updateQuantity(item.id || item.product.id, 1)}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="text-zinc-300 hover:text-red-500 p-2 shrink-0 transition-colors cursor-pointer"
                      onClick={() => removeFromCart(item.id || item.product.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer Summary */}
          {cart.length > 0 && (
            <div className="px-7 py-6 border-t border-zinc-100 bg-white space-y-4">
              <div className="flex items-center justify-between text-sm font-bold text-zinc-400">
                <span className="uppercase tracking-wider text-xs">Subtotal:</span>
                <span className="text-lg text-zinc-900 font-black">Rp {cartSubtotal.toLocaleString("id-ID")}</span>
              </div>
              <p className="text-[10px] text-zinc-400 text-left leading-relaxed">
                Pajak dan biaya pengiriman akan dihitung pada saat checkout. Semua produk dikirim langsung dari Desa Berakit.
              </p>
              <div className="pt-1 flex gap-3">
                <Button 
                  className="flex-1 h-12 bg-[#bef264] hover:bg-[#b2e658] text-black font-extrabold uppercase text-xs tracking-widest rounded-full flex items-center justify-center gap-2 shadow-md shadow-[#bef264]/10 hover:shadow-[#bef264]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Checkout Sekarang <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. CHECKOUT DIALOG / POPUP */}
      <Dialog open={isCheckoutOpen} onOpenChange={handleCheckoutClose}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white rounded-3xl p-6 overflow-hidden">
          {checkoutSuccess ? (
            <div className="py-8 text-center space-y-6">
              <div className="size-16 rounded-full bg-[#bef264]/10 text-[#bef264] flex items-center justify-center border border-[#bef264]/20 mx-auto">
                <CheckCircle className="size-8" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  PESANAN DITERIMA!
                </DialogTitle>
                <p className="text-xs text-zinc-400 font-mono">ORDER ID: {lastCreatedOrderId}</p>
                <DialogDescription className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed font-normal">
                  Terima kasih telah memesan di BERAKIT SERIES. Admin kami akan segera menghubungi Anda melalui nomor telepon untuk konfirmasi pengiriman.
                </DialogDescription>
              </div>
              <Button 
                onClick={handleCheckoutClose}
                className="w-full bg-[#bef264] hover:bg-[#bef264]/90 text-black font-bold uppercase text-xs tracking-wider py-5 rounded-full"
              >
                Kembali Belanja
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="space-y-6 text-left">
              <div>
                <DialogTitle className="text-2xl font-black uppercase text-white tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  FORMULIR CHECKOUT
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-xs mt-1">
                  Selesaikan pesanan Batik Anda dengan mengisi data lengkap pengiriman di bawah ini.
                </DialogDescription>
              </div>

              {/* Order Summary Summary */}
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ringkasan Pembelian</span>
                <div className="max-h-[100px] overflow-y-auto space-y-1.5 pr-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-xs text-zinc-300">
                      <span className="line-clamp-1">{item.product.name} (x{item.quantity})</span>
                      <span className="font-mono">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-zinc-800" />
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>TOTAL:</span>
                  <span className="text-sm text-[#bef264] font-mono">Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                    <Input
                      type="text"
                      placeholder="Masukkan nama Anda"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white rounded-xl pl-10 focus:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nomor WhatsApp / HP</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
                    <Input
                      type="tel"
                      placeholder="Contoh: 08123456789"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white rounded-xl pl-10 focus:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Alamat Lengkap Pengiriman</label>
                  <textarea
                    placeholder="Masukkan alamat jalan, RT/RW, kelurahan, kecamatan, kabupaten, kode pos"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 focus:border-zinc-700 focus:outline-none text-sm leading-relaxed"
                  />
                </div>

                {/* Payment Option */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                        paymentMethod === "COD" 
                          ? "bg-[#bef264] border-[#bef264] text-black" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Bayar di Tempat (COD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Transfer")}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${
                        paymentMethod === "Transfer" 
                          ? "bg-[#bef264] border-[#bef264] text-black" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Transfer Bank
                    </button>
                  </div>
                </div>

                {/* Bank Details & Proof of Transfer (If Transfer selected) */}
                {paymentMethod === "Transfer" && (
                  <div className="space-y-4 pt-2 border-t border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Rekening Tujuan Transfer</span>
                      
                      {/* Bank 1 */}
                      <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/50">
                        <div>
                          <div className="font-extrabold text-zinc-300">BANK BRI</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">0033-01-001234-56-7</div>
                          <div className="text-[10px] text-zinc-400">a.n BUMDes Berakit Maju</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-[#bef264] hover:text-[#bef264] hover:bg-[#bef264]/10 rounded-lg px-2 border-none"
                          onClick={() => {
                            navigator.clipboard.writeText("003301001234567");
                            toast.success("Nomor rekening BRI disalin!");
                          }}
                        >
                          Salin
                        </Button>
                      </div>

                      {/* Bank 2 */}
                      <div className="flex items-center justify-between text-xs py-1">
                        <div>
                          <div className="font-extrabold text-zinc-300">BANK RIAU KEPRI SYARIAH</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">109-20-12345</div>
                          <div className="text-[10px] text-zinc-400">a.n BUMDes Berakit Maju</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-[#bef264] hover:text-[#bef264] hover:bg-[#bef264]/10 rounded-lg px-2 border-none"
                          onClick={() => {
                            navigator.clipboard.writeText("1092012345");
                            toast.success("Nomor rekening Riau Kepri disalin!");
                          }}
                        >
                          Salin
                        </Button>
                      </div>
                    </div>

                    {/* Bukti Transfer Upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Unggah Bukti Transfer (Wajib)</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setReceiptFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setReceiptPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label
                          htmlFor="receipt-upload"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 rounded-2xl p-4 cursor-pointer hover:bg-zinc-900 transition-all text-center gap-1.5"
                        >
                          {receiptPreview ? (
                            <div className="space-y-2">
                              <img src={receiptPreview} className="max-h-24 object-contain rounded-lg mx-auto" alt="Preview" />
                              <span className="text-[10px] text-zinc-400 font-mono block truncate max-w-[200px]">
                                {receiptFile?.name}
                              </span>
                              <span className="text-[10px] text-[#bef264] font-extrabold uppercase tracking-wider block">Ganti Bukti</span>
                            </div>
                          ) : (
                            <>
                              <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
                                <Plus className="size-4" />
                              </div>
                              <span className="text-xs text-zinc-300 font-bold">Pilih Gambar Bukti Transfer</span>
                              <span className="text-[10px] text-zinc-500">Maks. 5MB (Format: JPG, PNG, WEBP)</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold uppercase text-xs tracking-wider py-5 rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#bef264] hover:bg-[#bef264]/90 text-black font-bold uppercase text-xs tracking-wider py-5 rounded-full"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin mx-auto" /> : "Buat Pesanan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
