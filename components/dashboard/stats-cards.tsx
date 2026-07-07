"use client";

import * as React from "react";
import { Coins, Package, ClipboardList, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  stock: number;
}

interface Transaction {
  id: string;
  total_amount: number;
  status: string;
}

export function StatsCards() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    revenue: 0,
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
  });

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;

    let productsList: Product[] = [];
    let transactionsList: Transaction[] = [];

    if (hasCredentials) {
      try {
        // Fetch products
        const { data: pData, error: pError } = await supabase
          .from("products")
          .select("id, stock");
        if (pError) throw pError;
        productsList = pData || [];

        // Fetch orders
        const { data: oData, error: oError } = await supabase
          .from("orders")
          .select("id, total_amount, status");
        if (oError) throw oError;
        transactionsList = oData || [];
      } catch (err) {
        console.error("Failed to fetch stats from Supabase, fallback to localStorage:", err);
        const { localProducts, localTransactions } = loadLocalStorage();
        productsList = localProducts;
        transactionsList = localTransactions;
      }
    } else {
      const { localProducts, localTransactions } = loadLocalStorage();
      productsList = localProducts;
      transactionsList = localTransactions;
    }

    // Calculate metrics
    const revenue = transactionsList
      .filter((t) => t.status === "Selesai")
      .reduce((sum, t) => sum + Number(t.total_amount), 0);

    const totalProducts = productsList.length;
    const totalOrders = transactionsList.length;
    const lowStock = productsList.filter((p) => Number(p.stock) <= 5).length;

    setStats({
      revenue,
      totalProducts,
      totalOrders,
      lowStock,
    });
    setLoading(false);
  }, []);

  const loadLocalStorage = () => {
    let localProducts: Product[] = [];
    let localTransactions: Transaction[] = [];

    const products = localStorage.getItem("berakit_products");
    if (products) localProducts = JSON.parse(products);

    const transactions = localStorage.getItem("berakit_transactions");
    if (transactions) localTransactions = JSON.parse(transactions);

    return { localProducts, localTransactions };
  };

  React.useEffect(() => {
    loadStats();
    
    // Add event listener for local storage changes or tab changes
    window.addEventListener("focus", loadStats);
    return () => window.removeEventListener("focus", loadStats);
  }, [loadStats]);

  const cards = [
    {
      title: "Pendapatan Sukses",
      value: `Rp ${stats.revenue.toLocaleString("id-ID")}`,
      subtitle: "Dari transaksi 'Selesai'",
      isPositive: true,
      icon: Coins,
      color: "text-emerald-500",
    },
    {
      title: "Produk Terdaftar",
      value: stats.totalProducts.toString(),
      subtitle: "Total produk khas desa",
      isPositive: true,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Total Transaksi",
      value: stats.totalOrders.toString(),
      subtitle: "Pesanan masuk keseluruhan",
      isPositive: true,
      icon: ClipboardList,
      color: "text-purple-500",
    },
    {
      title: "Stok Hampir Habis",
      value: stats.lowStock.toString(),
      subtitle: "Stok produk <= 5 pcs",
      isPositive: stats.lowStock === 0,
      icon: AlertTriangle,
      color: stats.lowStock > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-6 rounded-xl border bg-card items-center justify-center min-h-[140px]">
        <div className="col-span-full flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-6 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Memuat statistik ringkas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
      {cards.map((card, index) => (
        <div key={card.title} className="flex items-start">
          <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-5">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <card.icon className={`size-3.5 sm:size-[18px] ${card.color}`} />
              <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">{card.title}</span>
            </div>
            <p className="text-base sm:text-xl lg:text-[24px] font-bold leading-tight tracking-tight text-foreground truncate">
              {card.value}
            </p>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {card.subtitle}
            </div>
          </div>
          {index < cards.length - 1 && (
            <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
          )}
        </div>
      ))}
    </div>
  );
}
