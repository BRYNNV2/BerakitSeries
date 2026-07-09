"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import Lenis from "lenis";
import "lenis/dist/lenis.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
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

// Helper to remove white background from the centerpiece image dynamically in client canvas
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
  
  // Flood fill visited array
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  
  const pushPixel = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue.push(idx);
  };
  
  // Push all boundary pixels
  for (let x = 0; x < width; x++) {
    pushPixel(x, 0);
    pushPixel(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushPixel(0, y);
    pushPixel(width - 1, y);
  }
  
  // BFS
  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    
    const rIdx = idx * 4;
    const r = data[rIdx];
    const g = data[rIdx + 1];
    const b = data[rIdx + 2];
    
    // If pixel is near-white (threshold > 230), make it transparent and propagate
    if (r > 230 && g > 230 && b > 230) {
      data[rIdx + 3] = 0; // Set alpha to 0
      
      // Propagate 4-way
      if (x > 0) pushPixel(x - 1, y);
      if (x < width - 1) pushPixel(x + 1, y);
      if (y > 0) pushPixel(x, y - 1);
      if (y < height - 1) pushPixel(x, y + 1);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function StorefrontPage() {
  const router = useRouter();

  // Initialize Lenis Smooth Scroll and sync with GSAP ScrollTrigger
  React.useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    const updateRaf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
    };
  }, []);

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
  const [activeProfileTab, setActiveProfileTab] = React.useState<"profile" | "collaboration" | "focus">("profile");

  // GSAP Refs & States
  const preloaderRef = React.useRef<HTMLDivElement>(null);
  const heroCtaRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  const horizontalWrapperRef = React.useRef<HTMLDivElement>(null);
  const horizontalContainerRef = React.useRef<HTMLDivElement>(null);

  const [progress, setProgress] = React.useState(0);
  const [processedBatikSrc, setProcessedBatikSrc] = React.useState("/batik-center.png");
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const tweenRef = React.useRef<gsap.core.Tween | null>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoveredNavLink, setHoveredNavLink] = React.useState<number | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // BUMDes config (loaded from settings / fallbacks)
  const [bumdesInfo, setBumdesInfo] = React.useState({
    name: "BERAKIT SERIES",
    phone: "081234567890",
    address: "Desa Berakit, RT 02 / RW 01, Kecamatan Teluk Sebong, Bintan",
    bankName: "Bank Riau Kepri Syariah",
    bankAccount: "102-09-08765",
    bankHolder: "BERAKIT SERIES HQ",
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
            name: "Batik Tulis Biota Laut",
            description: "Batik tulis eksklusif dengan motif terumbu karang dan gonggong khas pesisir Berakit. Dibuat menggunakan pewarna alam premium.",
            price: 450000,
            stock: 24,
            image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=80",
            category: "Batik Tulis",
          },
          {
            id: "prod-2",
            name: "Batik Cap Mangrove Berakit",
            description: "Batik cap motif daun mangrove dengan desain geometris modern, sangat cocok untuk pakaian formal dan semi-formal.",
            price: 195000,
            stock: 80,
            image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500&auto=format&fit=crop&q=80",
            category: "Batik Cap",
          },
          {
            id: "prod-3",
            name: "Batik Kombinasi Semelur",
            description: "Perpaduan elegan teknik cap dan canting tulis dengan corak ombak samudra biru tua yang menawan.",
            price: 295000,
            stock: 5,
            image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=80",
            category: "Batik Kombinasi",
          },
          {
            id: "prod-4",
            name: "Selendang Sutra Batik Berakit",
            description: "Selendang sutra premium bermotif batik tulis pesisir yang halus, memberikan sentuhan mewah pada penampilan Anda.",
            price: 150000,
            stock: 12,
            image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80",
            category: "Aksesoris",
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

  React.useEffect(() => {
    const img = new Image();
    img.src = "/batik-center.png";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const transparentDataUrl = removeBackground(img);
        setProcessedBatikSrc(transparentDataUrl);
      } catch (e) {
        console.error("Failed to remove image background", e);
      }
    };
  }, []);

  React.useEffect(() => {
    const marqueeEl = marqueeRef.current;
    if (!marqueeEl) return;
    
    // Start from -50% to have buffer on left and right
    gsap.set(marqueeEl, { xPercent: -50 });
    
    // Tween from -50 to -25 to move to the right (speed increased to 12s)
    const tween = gsap.to(marqueeEl, {
      xPercent: -25,
      repeat: -1,
      duration: 12,
      ease: "none",
      paused: false
    });
    
    tweenRef.current = tween;
    
    return () => {
      if (tween) tween.kill();
    };
  }, []);

  React.useEffect(() => {
    let lastScrollTop = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (isHovered) return;
      
      const scrollTop = window.scrollY;
      const delta = scrollTop - lastScrollTop;
      lastScrollTop = scrollTop;
      
      // Calculate velocity-based skew angle (clamp to max 12 degrees)
      const maxSkew = 12;
      const skewAmount = Math.min(Math.max(delta * 0.18, -maxSkew), maxSkew);
      
      // Animate skew on scroll
      gsap.to(marqueeRef.current, { skewX: skewAmount, duration: 0.1, overwrite: "auto" });
      
      if (delta > 0) {
        // Scroll down -> move left (timeScale = -2.8)
        gsap.to(tweenRef.current, { timeScale: -2.8, duration: 0.1, overwrite: "auto" });
      } else if (delta < 0) {
        // Scroll up -> move right faster (timeScale = 3.8)
        gsap.to(tweenRef.current, { timeScale: 3.8, duration: 0.1, overwrite: "auto" });
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!isHovered) {
          gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5, ease: "power1.out", overwrite: "auto" });
          gsap.to(marqueeRef.current, { skewX: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isHovered]);

  useGSAP(() => {
    const obj = { val: 0 };
    const tl = gsap.timeline();

    const preloaderTarget = preloaderRef.current || "#preloader";
    const headerTarget = headerRef.current || "header";
    const heroCtaTarget = heroCtaRef.current || ".hero-cta-container";

    // 1. Preload counter animation
    tl.to(obj, {
      val: 100,
      duration: 2.0,
      ease: "power2.out",
      onUpdate: () => {
        setProgress(Math.floor(obj.val));
      }
    });

    // 2. Preloader slide out
    tl.to(preloaderTarget, {
      yPercent: -100,
      duration: 0.85,
      ease: "power4.inOut",
    });

    // 3. Header reveal
    tl.fromTo(headerTarget, 
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
      "-=0.4"
    );

    // 4. Hero Background Text reveal
    tl.fromTo(".hero-text-bg-1, .hero-text-bg-2",
      { y: 70, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: "power4.out" },
      "-=0.5"
    );

    // 5. Centerpiece reveal
    tl.fromTo(".hero-centerpiece",
      { scale: 0.75, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: "back.out(1.4)" },
      "-=0.6"
    );

    // 7. Hero CTA buttons & cards
    tl.fromTo(heroCtaTarget,
      { y: 25, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
      "-=0.45"
    );

    // Bottom cards fade in
    tl.fromTo(".hero-bottom-left-card, .hero-bottom-right-card",
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" },
      "-=0.4"
    );

    // 8. Scroll exit animation (starts after reveal is complete)
    tl.add(() => {
      gsap.to(".hero-centerpiece", {
        scale: 0.85,
        opacity: 0,
        y: -80,
        scrollTrigger: {
          trigger: "#hero-section",
          start: "top top",
          end: "bottom 30%",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    });

    // 8. Collections ScrollTrigger Animation
    gsap.fromTo(
      ".collection-card-animate",
      {
        y: 100,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#collections-section",
          start: "top 82%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

    // 9. Difference Section ScrollTrigger Animation
    const diffTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#difference-section",
        start: "top 80%",
        toggleActions: "play reverse play reverse"
      }
    });

    diffTl.fromTo(
      "#difference-header",
      {
        y: 80,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power3.out"
      }
    ).fromTo(
      ".difference-card-animate",
      {
        y: 80,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.15,
        ease: "power3.out"
      },
      "-=0.5"
    );

    // 10. Voices Horizontal Pinning ScrollTrigger
    const container = horizontalContainerRef.current;
    const wrapper = horizontalWrapperRef.current;
    if (container && wrapper) {
      const getScrollAmount = () => {
        return -(container.scrollWidth - wrapper.clientWidth);
      };

      gsap.set(container, { x: 0 });

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        gsap.to(container, {
          x: getScrollAmount,
          ease: "none",
          scrollTrigger: {
            trigger: "#voices-section",
            pin: true,
            pinSpacing: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${container.scrollWidth - wrapper.clientWidth}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              gsap.set("#sync-progress-bar", {
                width: `${self.progress * 100}%`
              });
            }
          }
        });
      });

      // Smooth entrance reveal for the left column
      gsap.fromTo(
        "#voices-left-col",
        {
          opacity: 0,
          x: -50
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#voices-section",
            start: "top 80%",
            toggleActions: "play reverse play reverse"
          }
        }
      );

      // Smooth entrance reveal for the cards
      gsap.fromTo(
        ".voices-card-animate",
        {
          y: 60,
          opacity: 0,
          scale: 0.95
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#voices-section",
            start: "top 80%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
      // Smooth entrance reveal for the FAQ left column
      gsap.fromTo(
        "#faq-left-col",
        {
          opacity: 0,
          y: 40
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#faq-section",
            start: "top 80%",
            toggleActions: "play reverse play reverse"
          }
        }
      );

      // Smooth entrance reveal for the Map Hub section
      gsap.fromTo(
        "#hub-left-col",
        {
          opacity: 0,
          x: -50
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#hub-section",
            start: "top 80%",
            toggleActions: "play reverse play reverse"
          }
        }
      );

      gsap.fromTo(
        "#hub-map-container",
        {
          opacity: 0,
          scale: 0.9,
          clipPath: "inset(10% 10% 10% 10% round 32px)",
        },
        {
          opacity: 1,
          scale: 1,
          clipPath: "inset(0% 0% 0% 0% round 32px)",
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#hub-section",
            start: "top 80%",
            toggleActions: "play reverse play reverse"
          }
        }
      );

      // Smooth entrance reveal for the Newsletter section
      gsap.fromTo(
        "#newsletter-card",
        {
          opacity: 0,
          y: 60,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#newsletter-section",
            start: "top 85%",
            toggleActions: "play reverse play reverse"
          }
        }
      );

      // Smooth entrance reveal for the Footer section
      gsap.fromTo(
        "#footer-section",
        {
          opacity: 0,
          y: 40
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#footer-section",
            start: "top 95%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
    }
  }, []);

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

    const message = `Halo BERAKIT SERIES,\nSaya ingin mengonfirmasi pesanan baru dari website:\n\n*Rincian Pembeli:*\n- Nama: ${customerName}\n- HP: ${customerPhone}\n- Alamat: ${customerAddress}\n\n*Pesanan:*\n${itemsSummary}\n- Ongkos Kirim: Rp ${(paymentMethod === "COD" ? 0 : bumdesInfo.shippingRate).toLocaleString("id-ID")}\n- Total Belanja: *Rp ${(totalCartPrice + (paymentMethod === "COD" ? 0 : bumdesInfo.shippingRate)).toLocaleString("id-ID")}*\n- Metode Bayar: *${paymentMethod}*\n\nMohon untuk segera diproses ya. Terima kasih!`;
    
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

  const marqueeBrands = [
    "VOGUE",
    "ELLE",
    "HARPER'S",
    "INSTYLE",
    "COSMOPOLITAN",
    "GQ",
    "GLAMOUR",
    "MARIE CLAIRE"
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans overflow-x-hidden relative">
      
      <div 
        ref={preloaderRef}
        id="preloader"
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none"
      >
        <div className="space-y-6 text-center animate-in fade-in duration-500">
          <div className="flex items-center gap-2.5 justify-center">
            <svg viewBox="0 0 24 24" className="size-8 text-white stroke-current fill-none stroke-[2]" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
            </svg>
            <span className="font-bold text-xl tracking-widest text-white uppercase">
              BERAKIT SERIES
            </span>
          </div>

          <div className="text-4xl sm:text-5xl font-extrabold text-white/95 font-mono tracking-tighter">
            {progress}%
          </div>

          <div className="w-[180px] sm:w-[240px] h-[2px] bg-zinc-900 rounded-full overflow-hidden mx-auto">
            <div 
              className="h-full bg-white transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

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

          {/* Center Navigation Pill (visible on desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Collections", href: "#" },
              { label: "New Arrivals", href: "#katalog" },
              { label: "Why Us", href: "#profil" },
              { label: "News Letter", href: "#hubungi-kami" },
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
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300 md:hidden ${
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
                { label: "Collections", href: "#" },
                { label: "New Arrivals", href: "#katalog" },
                { label: "Why Us", href: "#profil" },
                { label: "News Letter", href: "#hubungi-kami" },
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
            <button 
              className="w-full py-3 bg-black text-white font-bold rounded-lg uppercase text-sm tracking-wider hover:bg-zinc-800 transition-colors"
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/login");
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section 
        id="hero-section"
        className="relative overflow-hidden min-h-[90vh] flex flex-col justify-between bg-white pt-24 pb-12 px-4 sm:px-12 border-b border-zinc-200/50"
      >
        {/* Soft yellow-lime radial gradient behind layout */}
        <div className="absolute inset-x-0 top-0 h-[65%] bg-[radial-gradient(ellipse_at_top,rgba(197,255,46,0.22)_0%,transparent_70%)] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#bef264]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Big Background Typography (Placed below the header with custom spacing) */}
        <div className="w-full text-center pt-8 pb-4 relative z-0">
          <h1 
            className="flex flex-col items-center select-none"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px"
            }}
          >
            <span 
              className="text-[#111111] block hero-text-bg-1 text-center font-black tracking-tighter uppercase leading-[0.85] text-[7vw] sm:text-[8vw]"
              style={{
                fontFamily: "'Oswald', Impact, sans-serif",
                fontWeight: 900
              }}
            >
              ELEVATE YOUR STYLE
            </span>
            <span 
              className="text-[#bef264] block hero-text-bg-2 text-center font-black tracking-tighter uppercase leading-[0.85] text-[7vw] sm:text-[8vw]"
              style={{
                fontFamily: "'Oswald', Impact, sans-serif",
                fontWeight: 900
              }}
            >
              IN EVERY REALITY!
            </span>
          </h1>
        </div>

        {/* Centerpiece Image (Overlapping in front of the text) */}
        <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none select-none">
          <div className="relative hero-centerpiece-container">
            {/* Ambient product glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#bef264]/20 rounded-full blur-[100px] opacity-75 pointer-events-none" />
            <img 
              src={processedBatikSrc} 
              alt="BERAKIT SERIES Centerpiece" 
              className="hero-centerpiece h-[320px] sm:h-[420px] md:h-[500px] object-contain relative z-20 select-none pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            />
          </div>
        </div>

        {/* Bottom Row containing Info Card (Left), CTAs (Center), and Video Thumbnail (Right) */}
        <div className="w-full max-w-[1800px] mx-auto px-4 relative z-20 flex flex-col lg:flex-row items-center lg:items-end justify-between mt-auto gap-8">
          {/* Bottom Left Card */}
          <div className="hero-bottom-left-card hidden lg:flex flex-col bg-gradient-to-br from-[#f8faf2] to-white border border-zinc-200/50 rounded-3xl p-5 max-w-[280px] space-y-4 shadow-md text-left">
            <div className="flex -space-x-1.5">
              <div className="size-8 rounded-full border border-white bg-zinc-200 flex items-center justify-center text-[9px] font-bold text-zinc-700 uppercase tracking-wider">JD</div>
              <div className="size-8 rounded-full border border-white bg-zinc-300 flex items-center justify-center text-[9px] font-bold text-zinc-700 uppercase tracking-wider">AM</div>
              <div className="size-8 rounded-full border border-white bg-zinc-400 flex items-center justify-center text-[9px] font-bold text-zinc-700 uppercase tracking-wider">KR</div>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed font-semibold">
              Stay ahead of the curve with sustainably crafted Batik. Our premium collections support local weavers and artisans in Desa Berakit.
            </p>
          </div>

          {/* Center Buttons (CTA) */}
          <div ref={heroCtaRef} className="hero-cta-container flex items-center gap-3 relative z-30 lg:-translate-y-2">
            <a href="#katalog">
              <Button className="bg-black hover:bg-zinc-800 text-white font-bold px-8 py-5 rounded-full text-xs uppercase tracking-wider transition-all shadow-md">
                Shop Now
              </Button>
            </a>
            <Button 
              variant="outline" 
              className="border-zinc-200 bg-white hover:bg-zinc-50 text-black font-bold px-8 py-5 rounded-full text-xs uppercase tracking-wider transition-all"
              onClick={() => {
                const el = document.getElementById("profil");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore All &gt;
            </Button>
          </div>

          {/* Bottom Right Card */}
          <div className="hero-bottom-right-card hidden lg:block relative rounded-3xl overflow-hidden aspect-video w-[220px] border border-zinc-200/50 group cursor-pointer shadow-md">
            <img 
              src="/hero-thumbnail.png" 
              alt="Video Preview" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="size-4 fill-current ml-0.5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Marquee Section */}
      <div className="w-full bg-white py-12 border-b border-zinc-200/50 overflow-hidden relative">
        <div 
          className="w-full text-center mb-6 uppercase select-none"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 700,
            color: "lab(48.496 0 0)",
            fontSize: "16px",
            lineHeight: "24px"
          }}
        >
          As Featured In
        </div>
        
        <div 
          className="select-none relative w-full flex items-center overflow-hidden py-4 cursor-pointer"
          onMouseEnter={() => {
            setIsHovered(true);
            gsap.to(tweenRef.current, { timeScale: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5, ease: "power2.out", overwrite: "auto" });
          }}
        >
          <div 
            className="flex whitespace-nowrap min-w-full" 
            ref={marqueeRef}
          >
            {/* Set 1 */}
            <div className="flex items-center gap-16 sm:gap-24 px-8 sm:px-12">
              {marqueeBrands.map((brand, i) => (
                <span 
                  key={`s1-${i}`} 
                  className="text-[#e5e7eb] hover:text-[rgb(212,249,49)] transition-colors duration-300 select-none cursor-pointer"
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontWeight: 900,
                    fontSize: "144px",
                    lineHeight: "144px"
                  }}
                >
                  {brand}
                </span>
              ))}
            </div>
            {/* Set 2 */}
            <div className="flex items-center gap-16 sm:gap-24 px-8 sm:px-12">
              {marqueeBrands.map((brand, i) => (
                <span 
                  key={`s2-${i}`} 
                  className="text-[#e5e7eb] hover:text-[rgb(212,249,49)] transition-colors duration-300 select-none cursor-pointer"
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontWeight: 900,
                    fontSize: "144px",
                    lineHeight: "144px"
                  }}
                >
                  {brand}
                </span>
              ))}
            </div>
            {/* Set 3 */}
            <div className="flex items-center gap-16 sm:gap-24 px-8 sm:px-12">
              {marqueeBrands.map((brand, i) => (
                <span 
                  key={`s3-${i}`} 
                  className="text-[#e5e7eb] hover:text-[rgb(212,249,49)] transition-colors duration-300 select-none cursor-pointer"
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontWeight: 900,
                    fontSize: "144px",
                    lineHeight: "144px"
                  }}
                >
                  {brand}
                </span>
              ))}
            </div>
            {/* Set 4 */}
            <div className="flex items-center gap-16 sm:gap-24 px-8 sm:px-12">
              {marqueeBrands.map((brand, i) => (
                <span 
                  key={`s4-${i}`} 
                  className="text-[#e5e7eb] hover:text-[rgb(212,249,49)] transition-colors duration-300 select-none cursor-pointer"
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontWeight: 900,
                    fontSize: "144px",
                    lineHeight: "144px"
                  }}
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Explore Our Collections */}
      <section 
        id="collections-section" 
        className="w-full bg-[#fbfcfb] py-16 sm:py-24 border-b border-zinc-200/50"
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div className="space-y-2 text-left">
              <span 
                className="block uppercase tracking-[0.25em]"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  color: "rgb(212, 249, 49)",
                  fontSize: "14px",
                  lineHeight: "20px"
                }}
              >
                Shop By Category
              </span>
              <h2 
                className="uppercase text-left flex flex-col lg:flex-row lg:items-end gap-x-4 leading-none"
              >
                <span 
                  className="block tracking-tighter"
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontWeight: 400,
                    color: "lab(2.75381 0 0)",
                    fontSize: "clamp(48px, 8vw, 88px)",
                    lineHeight: "clamp(48px, 8vw, 88px)"
                  }}
                >
                  Explore Our
                </span>
                <span 
                  className="block leading-none tracking-tighter"
                  style={{
                    fontFamily: "'Oswald', Impact, sans-serif",
                    fontWeight: 900,
                    color: "lab(48.496 0 0)",
                    fontSize: "clamp(48px, 8vw, 88px)",
                    lineHeight: "clamp(48px, 8vw, 88px)"
                  }}
                >
                  Collections
                </span>
              </h2>
            </div>
            <div>
              <a 
                href="#katalog" 
                className="inline-flex items-center gap-2 uppercase select-none transition-all duration-300 tracking-[0.2em] hover:tracking-[0.3em] hover:text-[rgb(212,249,49)] text-black"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "20px"
                }}
              >
                View All <span className="text-zinc-400 transition-colors">—</span>
              </a>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center lg:items-start max-w-[1800px] mx-auto">
            {/* Card 1: Forest Honey (Kotak 1) */}
            <div className="collection-card-animate w-full lg:w-[872.5px] h-[500px] lg:h-[850px] rounded-[24px] overflow-hidden relative group cursor-pointer shadow-md bg-zinc-900">
              {/* Image */}
              <img 
                src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=80" 
                alt="Batik Tulis Collection" 
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
              
              {/* Card content info */}
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">
                    Exclusive Canting
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-none">
                    Batik Tulis
                  </h3>
                </div>
                {/* Arrow Button */}
                <div className="size-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#bef264] group-hover:text-black group-hover:border-[#bef264] transition-all duration-300 transform group-hover:rotate-45">
                  <ArrowRight className="size-5 transform -rotate-45" />
                </div>
              </div>
            </div>

            {/* Card 2: Local Crafts (Kotak 2) */}
            <div className="collection-card-animate w-full lg:w-[420.25px] h-[500px] lg:h-[850px] rounded-[24px] overflow-hidden relative group cursor-pointer shadow-md bg-zinc-900">
              {/* Image */}
              <img 
                src="https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=800&auto=format&fit=crop&q=80" 
                alt="Batik Cap Collection" 
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
              
              {/* Card content info */}
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">
                    Modern Stamps
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-none">
                    Batik Cap
                  </h3>
                </div>
                {/* Arrow Button */}
                <div className="size-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#bef264] group-hover:text-black group-hover:border-[#bef264] transition-all duration-300 transform group-hover:rotate-45">
                  <ArrowRight className="size-5 transform -rotate-45" />
                </div>
              </div>
            </div>

            {/* Column 3: Stacked Cards (Kotak 3 & 4) */}
            <div className="flex flex-col gap-8 w-full lg:w-[420.25px]">
              {/* Card 3: Marine Products (Kotak 3) */}
              <div className="collection-card-animate w-full lg:w-[420.25px] h-[240px] lg:h-[409px] rounded-[24px] overflow-hidden relative group cursor-pointer shadow-md bg-zinc-900">
                {/* Image */}
                <img 
                  src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80" 
                  alt="Batik Kombinasi Collection" 
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                />
                {/* Bottom gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                
                {/* Card content info */}
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">
                      Hybrid Fusion
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-white uppercase leading-none">
                      Batik Kombinasi
                    </h3>
                  </div>
                  {/* Arrow Button */}
                  <div className="size-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#bef264] group-hover:text-black group-hover:border-[#bef264] transition-all duration-300 transform group-hover:rotate-45">
                    <ArrowRight className="size-5 transform -rotate-45" />
                  </div>
                </div>
              </div>

              {/* Card 4: Mangrove Ecotourism (Kotak 4) */}
              <div className="collection-card-animate w-full lg:w-[420.25px] h-[240px] lg:h-[409px] rounded-[24px] overflow-hidden relative group cursor-pointer shadow-md bg-zinc-900">
                {/* Image */}
                <img 
                  src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80" 
                  alt="Aksesoris Batik" 
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                />
                {/* Bottom gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                
                {/* Card content info */}
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">
                      Batik Accs
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-white uppercase leading-none">
                      Aksesoris Batik
                    </h3>
                  </div>
                  {/* Arrow Button */}
                  <div className="size-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#bef264] group-hover:text-black group-hover:border-[#bef264] transition-all duration-300 transform group-hover:rotate-45">
                    <ArrowRight className="size-5 transform -rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Why Choose Us / The Berakit Difference */}
      <section 
        id="difference-section" 
        className="w-full bg-white py-16 sm:py-24 border-b border-zinc-200/50"
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
          {/* Header Row */}
          <div id="difference-header" className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
            <div className="space-y-2 text-left max-w-[800px]">
              <span 
                className="block uppercase tracking-[0.25em]"
                style={{
                  fontFamily: "'Oswald', Impact, sans-serif",
                  fontWeight: 700,
                  color: "rgb(212, 249, 49)",
                  fontSize: "14px",
                  lineHeight: "20px"
                }}
              >
                Why Choose Us
              </span>
              <h2 
                className="uppercase tracking-tight text-black"
                style={{
                  fontFamily: "'Oswald', Impact, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 900,
                  fontSize: "clamp(48px, 8vw, 88px)",
                  lineHeight: "clamp(44px, 8vw, 79px)"
                }}
              >
                <span className="text-black">The Berakit</span><br />
                <span style={{ color: "lab(48.496 0 0)" }}>Difference</span>
                <span className="text-[#bef264]">.</span>
              </h2>
            </div>
            <div className="max-w-[450px] text-left">
              <p 
                className="text-zinc-500 font-normal"
                style={{ 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "18px",
                  lineHeight: "29px"
                }}
              >
                We don't just sell local products; we deliver an authentic coastal heritage. Every interaction is designed to support the local fishermen, craft artisans, and families of Desa Berakit.
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="difference-card-animate group bg-[#f8f9fa] border border-zinc-100 hover:border-[#bef264]/60 hover:bg-[#bef264]/5 hover:shadow-xl rounded-[24px] p-8 h-[340px] flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 relative cursor-pointer">
              {/* Faint Watermark */}
              <div className="absolute right-6 top-6 text-[100px] font-black text-black/[0.03] select-none leading-none">
                01
              </div>
              
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black transition-all duration-300 group-hover:bg-[#bef264] group-hover:text-black">
                <Truck className="size-6" />
              </div>

              {/* Card text & Arrow */}
              <div className="space-y-4 text-left">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <h3 
                      className="text-lg uppercase tracking-wide text-black group-hover:text-[#bef264] transition-colors duration-300"
                      style={{ fontFamily: "'Oswald', Impact, sans-serif", fontWeight: 700 }}
                    >
                      Free Worldwide Shipping
                    </h3>
                    <p 
                      className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px]"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      Free shipping on all orders over $150. Delivered to your doorstep within 5-7 business days.
                    </p>
                  </div>
                  <div className="size-8 rounded-full border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-[#bef264] transition-all duration-300 transform group-hover:translate-x-1">
                    <ArrowRight className="size-4 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="difference-card-animate group bg-[#f8f9fa] border border-zinc-100 hover:border-[#bef264]/60 hover:bg-[#bef264]/5 hover:shadow-xl rounded-[24px] p-8 h-[340px] flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 relative cursor-pointer">
              {/* Faint Watermark */}
              <div className="absolute right-6 top-6 text-[100px] font-black text-black/[0.03] select-none leading-none">
                02
              </div>
              
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black transition-all duration-300 group-hover:bg-[#bef264] group-hover:text-black animate-none">
                <RotateCcw className="size-6" />
              </div>

              {/* Card text & Arrow */}
              <div className="space-y-4 text-left">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <h3 
                      className="text-lg uppercase tracking-wide text-black group-hover:text-[#bef264] transition-colors duration-300"
                      style={{ fontFamily: "'Oswald', Impact, sans-serif", fontWeight: 700 }}
                    >
                      30-Day Free Returns
                    </h3>
                    <p 
                      className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px]"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      Not satisfied? Return within 30 days for a full refund. No questions asked.
                    </p>
                  </div>
                  <div className="size-8 rounded-full border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-[#bef264] transition-all duration-300 transform group-hover:translate-x-1">
                    <ArrowRight className="size-4 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="difference-card-animate group bg-[#f8f9fa] border border-zinc-100 hover:border-[#bef264]/60 hover:bg-[#bef264]/5 hover:shadow-xl rounded-[24px] p-8 h-[340px] flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 relative cursor-pointer">
              {/* Faint Watermark */}
              <div className="absolute right-6 top-6 text-[100px] font-black text-black/[0.03] select-none leading-none">
                03
              </div>
              
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black transition-all duration-300 group-hover:bg-[#bef264] group-hover:text-black">
                <Shield className="size-6" />
              </div>

              {/* Card text & Arrow */}
              <div className="space-y-4 text-left">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <h3 
                      className="text-lg uppercase tracking-wide text-black group-hover:text-[#bef264] transition-colors duration-300"
                      style={{ fontFamily: "'Oswald', Impact, sans-serif", fontWeight: 700 }}
                    >
                      Secure Checkout
                    </h3>
                    <p 
                      className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px]"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      Your payment information is encrypted and secure. Shop with confidence.
                    </p>
                  </div>
                  <div className="size-8 rounded-full border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-[#bef264] transition-all duration-300 transform group-hover:translate-x-1">
                    <ArrowRight className="size-4 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="difference-card-animate group bg-[#f8f9fa] border border-zinc-100 hover:border-[#bef264]/60 hover:bg-[#bef264]/5 hover:shadow-xl rounded-[24px] p-8 h-[340px] flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 relative cursor-pointer">
              {/* Faint Watermark */}
              <div className="absolute right-6 top-6 text-[100px] font-black text-black/[0.03] select-none leading-none">
                04
              </div>
              
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black transition-all duration-300 group-hover:bg-[#bef264] group-hover:text-black">
                <Headphones className="size-6" />
              </div>

              {/* Card text & Arrow */}
              <div className="space-y-4 text-left">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <h3 
                      className="text-lg uppercase tracking-wide text-black group-hover:text-[#bef264] transition-colors duration-300"
                      style={{ fontFamily: "'Oswald', Impact, sans-serif", fontWeight: 700 }}
                    >
                      24/7 Customer Support
                    </h3>
                    <p 
                      className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px]"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      Our dedicated team is here to help you anytime, anywhere.
                    </p>
                  </div>
                  <div className="size-8 rounded-full border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-[#bef264] transition-all duration-300 transform group-hover:translate-x-1">
                    <ArrowRight className="size-4 text-black" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Voices From The Grid (Horizontal scroll) */}
      <section 
        id="voices-section" 
        className="relative w-full lg:h-screen bg-white flex items-center overflow-x-hidden overflow-y-visible lg:overflow-hidden py-16 lg:py-0 border-b border-zinc-200/50"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left Column - Title & Progress */}
          <div id="voices-left-col" className="w-full lg:w-[420px] shrink-0 text-left space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#bef264] uppercase tracking-wider">
                <span className="animate-pulse">⚡</span> LIVE TRANSMISSIONS
              </div>
              <h2 
                className="uppercase tracking-tight text-black flex flex-col"
                style={{ 
                  fontFamily: "'Oswald', Impact, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 900,
                  fontSize: "clamp(48px, 8vw, 88px)",
                  lineHeight: "clamp(44px, 8vw, 79px)"
                }}
              >
                <span>VOICES FROM</span>
                <span>THE GRID<span className="text-[#bef264]">.</span></span>
              </h2>
              <p 
                className="text-zinc-500 font-normal max-w-[420px]"
                style={{ 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "18px",
                  lineHeight: "29px"
                }}
              >
                Decrypting user logs to reveal the unparalleled luxury experience in the digital-physical frontier.
              </p>
            </div>

            {/* Scroll Progress Bar */}
            <div className="space-y-2 pt-4">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                SYNC PROGRESS
              </div>
              <div className="w-[180px] h-[3px] bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  id="sync-progress-bar"
                  className="h-full bg-[#bef264] w-0 transition-all duration-75"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Horizontal Scroll Container */}
          <div className="w-full lg:flex-1 overflow-x-auto lg:overflow-hidden relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={horizontalWrapperRef}>
            <div 
              ref={horizontalContainerRef}
              className="flex gap-8 pl-4 pr-16 py-12 animate-in fade-in zoom-in duration-500"
              style={{ width: "fit-content" }}
            >
              {[
                {
                  id: "SYS.ID.REV-1",
                  quote: "Batik Tulis dari Berakit Series ini luar biasa indah! Motif terumbu karangnya sangat detail, bahannya adem dan nyaman dipakai seharian.",
                  user: "@NeonDrifter",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                },
                {
                  id: "SYS.ID.REV-2",
                  quote: "Batik Cap Mangrove modern sangat pas untuk ke kantor. Kombinasi coraknya dinamis dan warnanya awet tidak luntur.",
                  user: "@Holo_Hype",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                },
                {
                  id: "SYS.ID.REV-3",
                  quote: "Selendang batik sutranya sangat mewah! Cocok untuk kado premium, pengiriman cepat dan adminnya sangat ramah.",
                  user: "@SynthWave_99",
                  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                },
                {
                  id: "SYS.ID.REV-4",
                  quote: "Suka sekali dengan konsep pewarnaan alami di Batik Kombinasinya. Pembelian lewat COD sangat praktis dan aman.",
                  user: "@Grid_Runner",
                  avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80"
                },
                {
                  id: "SYS.ID.REV-5",
                  quote: "Koleksi Berakit Series keren sekali. Salut untuk BUMDes Berakit yang melestarikan warisan batik pesisir secara modern!",
                  user: "@Pixel_Punk",
                  avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                }
              ].map((card, idx) => (
                <div 
                  key={idx}
                  className="voices-card-animate group bg-white border border-zinc-100 hover:border-[#bef264]/80 hover:shadow-[0_0_35px_-5px_rgba(190,242,100,0.35)] rounded-[28px] p-8 w-[380px] sm:w-[420px] h-[440px] flex flex-col justify-between transition-all duration-300 relative cursor-pointer select-none shrink-0"
                >
                  {/* Corner Crosshairs */}
                  <div className="absolute top-4 left-4 text-[10px] font-light text-zinc-300 group-hover:text-[#bef264] transition-colors duration-300 select-none pointer-events-none">+</div>
                  <div className="absolute top-4 right-4 text-[10px] font-light text-zinc-300 group-hover:text-[#bef264] transition-colors duration-300 select-none pointer-events-none">+</div>
                  <div className="absolute bottom-4 left-4 text-[10px] font-light text-zinc-300 group-hover:text-[#bef264] transition-colors duration-300 select-none pointer-events-none">+</div>
                  <div className="absolute bottom-4 right-4 text-[10px] font-light text-zinc-300 group-hover:text-[#bef264] transition-colors duration-300 select-none pointer-events-none">+</div>

                  {/* Top Quote Icon watermark */}
                  <div 
                    className="absolute right-8 top-8 text-[120px] font-bold text-[#bef264]/10 select-none leading-none pointer-events-none"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    ”
                  </div>

                  {/* Card Header (Log entry details) */}
                  <div className="space-y-1 relative z-10">
                    <div className="text-[10px] font-extrabold text-[#bef264] tracking-widest">
                      LOG ENTRY
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400 font-mono tracking-tight">
                      {card.id}
                    </div>
                  </div>

                  {/* Card Quote */}
                  <div className="relative z-10 py-4 flex-1 flex items-center">
                    <p 
                      className="text-base sm:text-lg font-semibold text-zinc-900 leading-relaxed text-left"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      "{card.quote}"
                    </p>
                  </div>

                  {/* Card Footer (User details & Rating) */}
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-100 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={card.avatar} 
                          alt={card.user}
                          className="size-11 rounded-full object-cover border border-zinc-200 group-hover:border-[#bef264] transition-colors duration-300"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-zinc-100">
                          <CheckCircle className="size-3.5 text-[#bef264] fill-current" />
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                          {card.user}
                        </div>
                        <div className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          VERIFIED USER
                        </div>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex gap-0.5 text-[#bef264]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Frequently Asked Questions (FAQ) Accordion */}
      <section 
        id="faq-section" 
        className="relative w-full bg-white py-24 border-b border-zinc-200/50"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row gap-16 items-start relative z-10">
          {/* Left Column - Headline */}
          <div id="faq-left-col" className="w-full lg:w-[420px] shrink-0 text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#bef264] uppercase tracking-wider">
              <span>🗂</span> DATABASE QUERY
            </div>
            <h2 
              className="uppercase tracking-tight text-black flex flex-col"
              style={{ 
                fontFamily: "'Oswald', Impact, sans-serif",
                fontStyle: "normal",
                fontWeight: 900,
                fontSize: "clamp(48px, 8vw, 88px)",
                lineHeight: "clamp(44px, 8vw, 79px)"
              }}
            >
              <span>FREQUENTLY</span>
              <span>ASKED<span className="text-[#bef264]">.</span></span>
            </h2>
            <p 
              className="text-zinc-500 font-normal max-w-[420px]"
              style={{ 
                fontFamily: "'Inter', system-ui, sans-serif",
                fontStyle: "normal",
                fontWeight: 400,
                fontSize: "18px",
                lineHeight: "29px"
              }}
            >
              Find answers to the most common inquiries regarding our products, shipping, and secure village enterprise ecosystem.
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div className="w-full lg:flex-1 space-y-0">
            {[
              {
                q: "What are your shipping policies?",
                a: "We provide secure shipping on all orders. Your items will be securely delivered to your doorstep within 3-5 business days across Bintan and surrounding areas, or via shipping services for domestic orders."
              },
              {
                q: "Do you ship physical items or just digital assets?",
                a: "We ship authentic physical items including premium hand-drawn Batik Tulis, Batik Cap, Batik Kombinasi, and accessories direct from Berakit Village."
              },
              {
                q: "Is my payment data secure during checkout?",
                a: "Yes, all checkout transactions are routed through secure, verified channels. You can choose bank transfer or cash-on-delivery (COD) for maximum trust."
              },
              {
                q: "How can I reach out for assistance?",
                a: "You can easily reach us via the WhatsApp integration buttons on our page. Our village administrator will directly respond and assist you with your order status."
              },
              {
                q: "Where are these local products harvested and manufactured?",
                a: "All batik is sustainably crafted by the local artisan groups and women weavers of Berakit Village, using high-quality fabrics and traditional motifs."
              },
              {
                q: "Can I cancel or modify my order after checking out?",
                a: "Since our ordering system integrates directly with WhatsApp, you can coordinate cancellations or modifications immediately with the administrator before shipping."
              },
              {
                q: "How do I unlock bulk order pricing for BUMDes items?",
                a: "For corporate gifts, hospitality supply, or wholesale orders, contact the BUMDes administrator directly via our helpline to receive special volume discounts."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className={`border-b border-zinc-100 transition-colors duration-300 ${isOpen ? "bg-[#bef264]/5" : "hover:bg-zinc-50/50"}`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-6 flex items-center justify-between text-left group px-4 sm:px-6 transition-all"
                  >
                    <div className="flex items-center gap-6 pr-4">
                      {/* Number Prefix */}
                      <span className={`font-mono text-xs transition-colors duration-300 ${isOpen ? "text-[#bef264] font-bold" : "text-zinc-300 group-hover:text-zinc-500"}`}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {/* Question */}
                      <span 
                        className={`transition-colors duration-300 ${isOpen ? "text-[#bef264]" : "text-zinc-900 group-hover:text-zinc-700"}`}
                        style={{ 
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontWeight: 500,
                          fontSize: "clamp(18px, 4vw, 24px)",
                          lineHeight: "clamp(24px, 4vw, 33px)",
                          fontStyle: "normal"
                        }}
                      >
                        {faq.q}
                      </span>
                    </div>
                    {/* Plus / Close Icon */}
                    <span 
                      className={`text-2xl font-light transition-all duration-300 ${isOpen ? "rotate-45 text-[#bef264] scale-110" : "text-zinc-400 group-hover:text-zinc-600"}`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      +
                    </span>
                  </button>

                  {/* Answer Panel with smooth transition */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 pb-6 px-4 sm:px-6" : "grid-rows-[0fr] opacity-0"}`}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="min-h-0">
                      <div className="border-l-2 border-[#bef264] pl-4 py-1">
                        <p 
                          className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium"
                          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                        >
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6: Physical Hub / Satellite Uplink (Maps Section) */}
      <section 
        id="hub-section" 
        className="relative w-full py-24 sm:py-32 bg-white flex items-center overflow-hidden border-b border-zinc-200/50"
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
          {/* Left Column - Information Uplink */}
          <div id="hub-left-col" className="w-full lg:w-[480px] shrink-0 text-left space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#bef264] uppercase tracking-wider">
                <span className="size-2 rounded-full bg-[#bef264] animate-pulse" /> SATELLITE UPLINK
              </div>
              <h2 
                className="uppercase tracking-tight text-black"
                style={{ 
                  fontFamily: "'Oswald', Impact, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 900,
                  fontSize: "clamp(48px, 8vw, 88px)",
                  lineHeight: "clamp(44px, 8vw, 79px)"
                }}
              >
                PHYSICAL<br />
                <span className="text-zinc-400">HUB</span>
                <span className="text-[#bef264]">.</span>
              </h2>
              <p 
                className="text-zinc-500 font-normal"
                style={{ 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "18px",
                  lineHeight: "29px"
                }}
              >
                Drop by our operational headquarters. Experience the seamless fusion of high-end infrastructure and digital realities.
              </p>
            </div>

            {/* Stepper info blocks */}
            <div className="relative space-y-4 pt-4">
              {/* Absolute vertical timeline line behind circle icons */}
              <div className="absolute left-[36px] top-10 bottom-10 w-[1.5px] bg-zinc-200/80 pointer-events-none" />

              {/* Step 1: Coordinates */}
              <div className="relative z-10 flex gap-4 p-4 rounded-[20px] border border-transparent hover:bg-zinc-50 hover:border-zinc-100/60 hover:shadow-xs transition-all duration-300 group cursor-pointer hover:translate-x-1">
                <div className="shrink-0">
                  <div className="size-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-950 bg-white shadow-xs transition-all duration-300 group-hover:bg-[#bef264]/20 group-hover:border-[#bef264] group-hover:text-[#bef264]">
                    <MapPin className="size-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span 
                    className="block transition-colors duration-300 group-hover:text-[#bef264] uppercase tracking-widest"
                    style={{
                      fontFamily: "Consolas, Monaco, monospace",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: "rgb(161, 161, 170)"
                    }}
                  >
                    COORDINATES
                  </span>
                  <h4 
                    className="transition-colors duration-300 group-hover:text-black uppercase" 
                    style={{ 
                      fontFamily: "'Oswald', Impact, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "24px",
                      lineHeight: "32px",
                      color: "rgb(24, 24, 27)"
                    }}
                  >
                    BUMDES BERAKIT HQ
                  </h4>
                  <p 
                    className="transition-colors duration-300 group-hover:text-zinc-700 font-normal max-w-sm" 
                    style={{ 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 400,
                      color: "lab(48.496 0 0)",
                      fontSize: "16px",
                      lineHeight: "26px"
                    }}
                  >
                    Jalan Bhatin Muhammad Ali, Gang Asiah No. 20, RT 06 / RW 03, Semelur Desa Berakit Kecamatan Teluk Sebong Kabupaten Bintan, Kepulauan Riau
                  </p>
                </div>
              </div>

              {/* Step 2: Access Time */}
              <div className="relative z-10 flex gap-4 p-4 rounded-[20px] border border-transparent hover:bg-zinc-50 hover:border-zinc-100/60 hover:shadow-xs transition-all duration-300 group cursor-pointer hover:translate-x-1">
                <div className="shrink-0">
                  <div className="size-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-950 bg-white shadow-xs transition-all duration-300 group-hover:bg-[#bef264]/20 group-hover:border-[#bef264] group-hover:text-[#bef264]">
                    <Clock className="size-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span 
                    className="block transition-colors duration-300 group-hover:text-[#bef264] uppercase tracking-widest"
                    style={{
                      fontFamily: "Consolas, Monaco, monospace",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: "rgb(161, 161, 170)"
                    }}
                  >
                    OFFLINE ACCESS
                  </span>
                  <h4 
                    className="transition-colors duration-300 group-hover:text-black uppercase" 
                    style={{ 
                      fontFamily: "'Oswald', Impact, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "24px",
                      lineHeight: "32px",
                      color: "rgb(24, 24, 27)"
                    }}
                  >
                    08:00 - 17:00
                  </h4>
                  <p 
                    className="transition-colors duration-300 group-hover:text-zinc-700 font-normal" 
                    style={{ 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 400,
                      color: "lab(48.496 0 0)",
                      fontSize: "16px",
                      lineHeight: "26px"
                    }}
                  >
                    Local Time / GMT+7
                  </p>
                </div>
              </div>

              {/* Step 3: Digital Comm */}
              <div className="relative z-10 flex gap-4 p-4 rounded-[20px] border border-transparent hover:bg-zinc-50 hover:border-zinc-100/60 hover:shadow-xs transition-all duration-300 group cursor-pointer hover:translate-x-1">
                <div className="shrink-0">
                  <div className="size-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-950 bg-white shadow-xs transition-all duration-300 group-hover:bg-[#bef264]/20 group-hover:border-[#bef264] group-hover:text-[#bef264]">
                    <Mail className="size-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span 
                    className="block transition-colors duration-300 group-hover:text-[#bef264] uppercase tracking-widest"
                    style={{
                      fontFamily: "Consolas, Monaco, monospace",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "12px",
                      lineHeight: "16px",
                      color: "rgb(161, 161, 170)"
                    }}
                  >
                    DIGITAL COMM
                  </span>
                  <h4 
                    className="transition-colors duration-300 group-hover:text-black uppercase" 
                    style={{ 
                      fontFamily: "'Oswald', Impact, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "24px",
                      lineHeight: "32px",
                      color: "rgb(24, 24, 27)"
                    }}
                  >
                    mfyansah@student.umrah.ac.id
                  </h4>
                  <p 
                    className="transition-colors duration-300 group-hover:text-zinc-700 font-normal" 
                    style={{ 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 400,
                      color: "lab(48.496 0 0)",
                      fontSize: "16px",
                      lineHeight: "26px"
                    }}
                  >
                    24/7 Secure Contact Channel
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Right Column - Map Frame */}
          <div className="w-full flex-1 max-w-[840px]">
            <div 
              id="hub-map-container"
              className="relative w-full aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden border border-zinc-200 bg-zinc-950 shadow-2xl"
            >
              {/* Map iframe */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4731.657649311793!2d104.5499708!3d1.210686!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31dbd9beffe89e77%3A0x8496e2d6a6e327df!2sWisata%20Mangrove%20Tanjung%20Berakit!5e1!3m2!1sid!2sid!4v1783596097087!5m2!1sid!2sid" 
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                style={{
                  filter: "invert(90%) hue-rotate(180deg) saturate(60%) brightness(95%) contrast(90%)",
                }}
              />

              {/* Futuristic Scan HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative size-20 border border-[#bef264]/40 rounded-full flex items-center justify-center animate-ping duration-[3.5s]" />
                <div className="absolute size-10 border border-[#bef264]/50 rounded-full flex items-center justify-center">
                  <div className="size-1.5 bg-[#bef264] rounded-full" />
                </div>
                <div className="absolute w-14 h-[1px] bg-[#bef264]/30" />
                <div className="absolute w-[1px] h-14 bg-[#bef264]/30" />
              </div>

              {/* Floating Badges */}
              <a 
                href="https://maps.google.com/?q=Wisata+Mangrove+Tanjung+Berakit" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="absolute top-6 left-6 bg-zinc-950/75 hover:bg-zinc-950 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 hover:scale-105"
              >
                Open in Maps <ArrowRight className="size-3 -rotate-45" />
              </a>

              <div className="absolute top-6 right-6 bg-zinc-950/75 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#bef264] animate-pulse" /> LIVE FEED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Newsletter (GET 15% OFF YOUR FIRST ORDER.) */}
      <section 
        id="newsletter-section" 
        className="relative w-full py-24 sm:py-32 bg-white flex items-center overflow-hidden border-b border-zinc-200/50"
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <div 
            id="newsletter-card"
            className="w-full bg-zinc-950 rounded-[32px] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 border border-zinc-800 shadow-2xl"
          >
            {/* Subtle background gradient glow */}
            <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#bef264]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-zinc-800/20 rounded-full blur-[80px] pointer-events-none" />

            {/* Left Column: Heading */}
            <div className="w-full lg:max-w-xl text-left space-y-2 relative z-10">
              <h2 
                className="uppercase tracking-tight text-white flex flex-col"
                style={{ 
                  fontFamily: "'Oswald', Impact, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 900,
                  fontSize: "clamp(40px, 8vw, 88px)",
                  lineHeight: "clamp(36px, 8vw, 79px)"
                }}
              >
                <span>GET 15% OFF</span>
                <span className="text-[#bef264]">YOUR FIRST</span>
                <span className="text-zinc-500">ORDER.</span>
              </h2>
            </div>

            {/* Right Column: Form */}
            <div className="w-full lg:max-w-xl text-left space-y-6 relative z-10">
              {/* Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800/80 text-[11px] font-bold text-[#bef264] uppercase tracking-wider">
                <span className="size-1.5 rounded-full bg-[#bef264] animate-pulse" /> JOIN 50,000+ SUBSCRIBERS
              </div>

              <p 
                className="text-zinc-400 font-normal"
                style={{ 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "26px"
                }}
              >
                Subscribe to our exclusive newsletter and be the first to know about new digital drops, limited offers, and boundary-pushing style tips.
              </p>

              {/* Input Form */}
              <form onSubmit={(e) => e.preventDefault()} className="w-full bg-white p-2 rounded-full flex items-center justify-between shadow-lg max-w-[500px]">
                <input 
                  type="email" 
                  placeholder="Enter your email address..."
                  className="w-full pl-6 pr-4 py-2 bg-transparent text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                />
                <button 
                  type="submit"
                  className="bg-[#bef264] hover:bg-[#bef264]/95 text-black font-bold uppercase text-xs tracking-wider px-6 py-3 rounded-full flex items-center gap-2 shrink-0 transition-all duration-300 hover:scale-102 cursor-pointer"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  SUBSCRIBE <ArrowRight className="size-4" />
                </button>
              </form>

              {/* Disclaimer */}
              <p className="text-xs text-zinc-500 font-medium">
                By subscribing, you agree to our <a href="#" className="text-zinc-400 hover:text-[#bef264] transition-colors underline">Terms of Service</a> and <a href="#" className="text-zinc-400 hover:text-[#bef264] transition-colors underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer 
        id="footer-section" 
        className="w-full bg-[#050505] py-16 border-t border-zinc-900 relative z-10 overflow-hidden"
      >
        {/* Style block for continuous marquee looping */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-loop {
            display: flex;
            width: max-content;
            animation: marquee 25s linear infinite;
          }
        `}</style>

        {/* Marquee Header */}
        <div className="w-full bg-[#050505] border-y border-zinc-900/60 py-6 mb-16 overflow-hidden relative z-10">
          <div className="animate-marquee-loop flex items-center gap-16">
            {/* Repeat pattern enough times for seamless infinite loops */}
            {Array(10).fill(null).map((_, i) => (
              <div key={i} className="flex items-center gap-16 shrink-0">
                <div className="flex items-center gap-4 text-zinc-500 font-bold uppercase tracking-wider text-xl md:text-2xl" style={{ fontFamily: "'Oswald', Impact, sans-serif" }}>
                  <span>GRAB YOUR OWN STYLE</span>
                  <div className="size-7 rounded-full bg-[#bef264] flex items-center justify-center text-black">
                    <ArrowUpRight className="size-4 stroke-[3]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                  fontSize: "36px",
                  lineHeight: "1.0"
                }}
              >
                BERAKIT SERIES<span className="text-[#bef264]">.</span>
              </span>
              <p 
                className="text-zinc-400 text-sm max-w-sm leading-relaxed font-normal"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Premium traditional coastal Batik fashion. Discover the ultimate convergence of cultural heritage and contemporary style.
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
                <li><a href="#collections-section" className="hover:text-[#bef264] transition-colors">New Arrivals</a></li>
                <li><a href="#collections-section" className="hover:text-[#bef264] transition-colors">Best Sellers</a></li>
                <li><a href="#collections-section" className="hover:text-[#bef264] transition-colors">Men</a></li>
                <li><a href="#collections-section" className="hover:text-[#bef264] transition-colors">Women</a></li>
                <li><a href="#collections-section" className="hover:text-[#bef264] transition-colors">Accessories</a></li>
                <li><a href="#collections-section" className="hover:text-[#bef264] transition-colors">Sale</a></li>
              </ul>
            </div>

            {/* Column 3: COMPANY */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest" style={{ fontFamily: "Consolas, monospace" }}>
                COMPANY
              </h5>
              <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                <li><a href="#difference-section" className="hover:text-[#bef264] transition-colors">About Us</a></li>
                <li><a href="#difference-section" className="hover:text-[#bef264] transition-colors">Careers</a></li>
                <li><a href="#difference-section" className="hover:text-[#bef264] transition-colors">Press</a></li>
                <li><a href="#difference-section" className="hover:text-[#bef264] transition-colors">Sustainability</a></li>
              </ul>
            </div>

            {/* Column 4: SUPPORT */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-widest" style={{ fontFamily: "Consolas, monospace" }}>
                SUPPORT
              </h5>
              <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                <li><a href="mailto:mfyansah@student.umrah.ac.id" className="hover:text-[#bef264] transition-colors">Contact Us</a></li>
                <li><a href="#faq-section" className="hover:text-[#bef264] transition-colors">FAQs</a></li>
                <li><a href="#faq-section" className="hover:text-[#bef264] transition-colors">Shipping</a></li>
                <li><a href="#faq-section" className="hover:text-[#bef264] transition-colors">Returns</a></li>
                <li><a href="#faq-section" className="hover:text-[#bef264] transition-colors">Size Guide</a></li>
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
              Designed & Built by <span className="text-[#bef264] font-bold">ThisisAngelo</span>
            </span>
          </div>
        </div>

        {/* Faint Background Watermark */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none select-none overflow-hidden z-0">
          <span 
            className="text-[18vw] font-black text-white/[0.012] tracking-widest leading-none uppercase" 
            style={{ fontFamily: "'Oswald', Impact, sans-serif" }}
          >
            BERAKIT SERIES
          </span>
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
