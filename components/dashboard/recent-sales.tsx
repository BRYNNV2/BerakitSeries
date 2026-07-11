"use client";

import * as React from "react";
import { TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, withTimeout } from "@/lib/supabase";

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

    if (supabase) {
      try {
        // Fetch all products
        const { data: pData, error: pError } = await withTimeout(
          supabase.from("products").select("id, name, price, image_url, category")
        );
        if (!pError && pData) {
          dbProducts = pData;
        }

        // Fetch all orders
        const { data: oData, error: oError } = await withTimeout(
          supabase.from("orders").select("items, status, created_at")
        );
        if (!oError && oData) {
          dbOrders = oData;
        }
      } catch (err) {
        console.error("Supabase failed in RecentSales load:", err);
      }
    }

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

    // Calculate actual sales counts and find last purchase times per product
    const salesMap: Record<string, number> = {};
    const lastPurchaseMap: Record<string, string> = {};

    dbOrders.forEach((order) => {
      if (order.status === "Dibatalkan") return;

      let itemsArray: any[] = [];
      if (typeof order.items === "string") {
        try {
          itemsArray = JSON.parse(order.items);
        } catch (e) {
          itemsArray = [];
        }
      } else if (Array.isArray(order.items)) {
        itemsArray = order.items;
      }

      itemsArray.forEach((item: any) => {
        const pId = item.product_id || item.id;
        if (pId) {
          const qty = Number(item.quantity) || 1;
          salesMap[pId] = (salesMap[pId] || 0) + qty;
          
          // Keep track of latest purchase time
          if (order.created_at) {
            const currentLast = lastPurchaseMap[pId];
            if (!currentLast || new Date(order.created_at) > new Date(currentLast)) {
              lastPurchaseMap[pId] = order.created_at;
            }
          }
        }
      });
    });

    // Map each product to its real sales item details
    const mappedSales = dbProducts.map((p) => {
      const totalSold = salesMap[p.id] || 0;
      const lastTime = lastPurchaseMap[p.id];
      const timeAgo = lastTime ? getRelativeTime(lastTime) : "Belum terjual";

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        salesCount: `${totalSold} terjual`,
        timeAgo,
        _totalSold: totalSold,
      };
    });

    // Sort descending by totalSold and get top 4
    const topSales = mappedSales
      .sort((a, b) => b._totalSold - a._totalSold)
      .slice(0, 4);

    setSales(topSales);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadRecentSales();
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
