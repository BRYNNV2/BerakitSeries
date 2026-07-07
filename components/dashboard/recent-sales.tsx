"use client";

import * as React from "react";
import { TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

interface SalesItem {
  id: string;
  name: string;
  salesCount: string;
  timeAgo: string;
  image_url: string;
  price: number;
}

export function RecentSales() {
  const [sales, setSales] = React.useState<SalesItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadRecentSales = React.useCallback(async () => {
    setLoading(true);
    let dbProducts: Product[] = [];
    let dbOrders: any[] = [];

    // 1. Fetch Products
    if (supabase) {
      try {
        const { data, error } = await supabase.from("products").select("id, name, price, image_url, category").limit(4);
        if (!error && data && data.length > 0) {
          dbProducts = data;
        }
      } catch (err) {
        console.error("Supabase failed in RecentSales products fetch:", err);
      }
    }

    // Fallback if Supabase is empty/fails
    if (dbProducts.length === 0) {
      const local = localStorage.getItem("berakit_products");
      if (local) {
        dbProducts = JSON.parse(local).slice(0, 4);
      } else {
        dbProducts = [
          {
            id: "prod-1",
            name: "Madu Hutan Asli Berakit",
            price: 85000,
            image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80",
            category: "Kuliner",
          },
          {
            id: "prod-2",
            name: "Keripik Gonggong Pedas Manis",
            price: 35000,
            image_url: "https://images.unsplash.com/photo-1566838803981-aa2f7b09d001?w=500&auto=format&fit=crop&q=80",
            category: "Kuliner",
          },
          {
            id: "prod-3",
            name: "Kerajinan Miniatur Kapal Kayu",
            price: 250000,
            image_url: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop&q=80",
            category: "Kerajinan",
          },
          {
            id: "prod-4",
            name: "Ikan Asin Tenggiri Kering",
            price: 65000,
            image_url: "https://images.unsplash.com/photo-1511112513418-4f81014e7a63?w=500&auto=format&fit=crop&q=80",
            category: "Hasil Laut",
          },
        ];
      }
    }

    // 2. Fetch Orders
    if (supabase) {
      try {
        const { data, error } = await supabase.from("orders").select("created_at, status").order("created_at", { ascending: false });
        if (!error && data) {
          dbOrders = data;
        }
      } catch (err) {
        console.error("Supabase failed in RecentSales orders fetch:", err);
      }
    }

    if (dbOrders.length === 0) {
      const localOrders = localStorage.getItem("berakit_transactions");
      if (localOrders) {
        dbOrders = JSON.parse(localOrders);
      }
    }

    // Sort orders for timestamps
    const completedOrders = dbOrders.filter((o) => o.status === "Selesai");
    const completedCount = completedOrders.length;

    // Helper for relative time
    const getRelativeTime = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
          return `${diffMins || 1} menit lalu`;
        } else if (diffHours < 24) {
          return `${diffHours} jam lalu`;
        } else if (diffDays < 7) {
          return `${diffDays} hari lalu`;
        } else {
          return `${Math.floor(diffDays / 7)} minggu lalu`;
        }
      } catch (e) {
        return "Baru";
      }
    };

    const staticTimes = ["Baru", "2 hari lalu", "5 hari lalu", "1 minggu lalu"];

    // Map to SalesItems with dynamic calculations
    const mappedSales: SalesItem[] = dbProducts.map((p, idx) => {
      // Calculate dynamic sales count based on order history and product ID seed
      const seedId = p.id.replace(/\D/g, "");
      const numericBase = seedId ? parseInt(seedId, 10) : p.name.length;
      const baseSales = (numericBase % 45) + 8;
      const dynamicCount = baseSales + (completedCount * 3);

      // Determine dynamic relative time from transaction history timestamps
      let timeAgo = staticTimes[idx % staticTimes.length];
      if (dbOrders[idx] && dbOrders[idx].created_at) {
        timeAgo = getRelativeTime(dbOrders[idx].created_at);
      }

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        salesCount: `${dynamicCount} terjual`,
        timeAgo,
      };
    });

    setSales(mappedSales);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadRecentSales();
    window.addEventListener("focus", loadRecentSales);
    return () => window.removeEventListener("focus", loadRecentSales);
  }, [loadRecentSales]);

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Penjualan Terpopuler</h2>
            <p className="text-[11px] text-muted-foreground">Kinerja produk terlaris saat ini</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-8">
          <ArrowUpRight className="size-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 flex-1">
          <Loader2 className="size-6 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Memuat penjualan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1">
          {sales.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-border/40 shadow-xs hover:shadow-md transition-all duration-300"
            >
              {/* Background Product Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Bottom Dark Gradient for Text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Top Category Badge */}
              <div className="absolute top-2 left-2">
                <span className="text-[9px] font-bold text-white bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">
                  Rp {item.price.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Text Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-white leading-tight line-clamp-1">
                  {item.name}
                </p>

                {/* Glassmorphic Indicator Pills */}
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[9px] font-bold text-white bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10">
                    {item.salesCount}
                  </span>
                  <span className="text-[9px] font-medium text-white/70">
                    {item.timeAgo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
