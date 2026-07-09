"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { ShoppingBag, Loader2, RefreshCw } from "lucide-react";
import { supabase, withTimeout } from "@/lib/supabase";
import { useDashboardStore } from "@/store/dashboard-store";

interface Product {
  id: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Batik Tulis": "#6e3ff3",
  "Batik Cap": "#e255f2",
  "Batik Kombinasi": "#35b9e9",
  "Aksesoris": "#375dfb",
};

export function LeadSourcesChart() {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const isActive = activeTab === "dashboard";
  const [loading, setLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [data, setData] = React.useState<{ name: string; value: number; color: string }[]>([]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;
    let productsList: Product[] = [];

    if (hasCredentials) {
      try {
        const { data: pData, error } = await withTimeout(
          supabase
            .from("products")
            .select("id, category")
        );
        if (error) throw error;
        productsList = pData || [];
      } catch (err) {
        console.warn("Failed to load products for categories chart from Supabase, fallback to localStorage:", err);
        productsList = loadLocalStorage();
      }
    } else {
      productsList = loadLocalStorage();
    }

    // Process categories
    const counts: Record<string, number> = {
      "Batik Tulis": 0,
      "Batik Cap": 0,
      "Batik Kombinasi": 0,
      "Aksesoris": 0,
    };

    productsList.forEach((p) => {
      const cat = p.category || "Batik Tulis";
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts["Batik Tulis"]++;
      }
    });

    const chartData = Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
      color: CATEGORY_COLORS[key] || "#6e3ff3",
    }));

    setData(chartData);
    setLoading(false);
  }, []);

  const loadLocalStorage = () => {
    const products = localStorage.getItem("berakit_products");
    if (products) {
      return JSON.parse(products);
    }
    return [];
  };

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const totalProducts = data.reduce((acc, item) => acc + item.value, 0);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: unknown) => {
    const typedProps = props as {
      cx: number;
      cy: number;
      innerRadius: number;
      outerRadius: number;
      startAngle: number;
      endAngle: number;
      fill: string;
    };
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      typedProps;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-xl border bg-card w-full xl:w-[410px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Button variant="outline" size="icon" className="size-7 sm:size-8">
            <ShoppingBag className="size-4 sm:size-[18px] text-muted-foreground" />
          </Button>
          <span className="text-sm sm:text-base font-semibold">Kategori Produk</span>
        </div>
        <Button variant="ghost" size="icon" className="size-7 sm:size-8" onClick={loadData}>
          <RefreshCw className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[220px] gap-2">
          <Loader2 className="size-6 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Memuat kategori...</span>
        </div>
      ) : totalProducts === 0 ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-center text-muted-foreground">
          <span className="text-sm">Tidak ada data produk</span>
          <span className="text-xs mt-1">Tambahkan produk di tab Produk Desa</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative shrink-0 size-[200px] mx-auto sm:mx-0">
            {isActive ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="78%"
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg sm:text-xl font-bold">
                {totalProducts}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Total Produk
              </span>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col gap-2.5 sm:gap-3">
            {data.map((item, index) => {
              if (item.value === 0) return null;
              return (
                <div
                  key={item.name}
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                    activeIndex !== null && activeIndex !== index
                      ? "opacity-50"
                      : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div
                    className="w-1.5 h-3.5 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex-1 text-xs sm:text-sm text-muted-foreground truncate">
                    {item.name}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold tabular-nums">
                    {item.value} item
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
