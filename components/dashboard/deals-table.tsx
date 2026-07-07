"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList,
  Search,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  total_amount: number;
  status: "Pending" | "Diproses" | "Selesai" | "Dibatalkan";
  payment_method: string;
  created_at: string;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    customer_name: "Budi Santoso",
    customer_phone: "081234567890",
    address: "Jl. Raya Berakit No. 12, Desa Berakit",
    total_amount: 170000,
    status: "Selesai",
    payment_method: "Transfer Bank",
    created_at: "2026-07-06T10:30:00Z",
  },
  {
    id: "tx-2",
    customer_name: "Siti Rahma",
    customer_phone: "089876543210",
    address: "RT 02 / RW 01, Dusun 2 Desa Berakit",
    total_amount: 35000,
    status: "Pending",
    payment_method: "COD",
    created_at: "2026-07-07T03:15:00Z",
  },
  {
    id: "tx-3",
    customer_name: "Andi Wijaya",
    customer_phone: "085299887766",
    address: "Penginapan Berakit Indah, RT 01",
    total_amount: 250000,
    status: "Diproses",
    payment_method: "Transfer Bank",
    created_at: "2026-07-07T05:40:00Z",
  },
  {
    id: "tx-4",
    customer_name: "Rina Kartika",
    customer_phone: "087711223344",
    address: "Kavling Nelayan, Desa Berakit",
    total_amount: 65000,
    status: "Dibatalkan",
    payment_method: "COD",
    created_at: "2026-07-05T08:20:00Z",
  },
];

export function DealsTable() {
  const [orders, setOrders] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;

    if (hasCredentials) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        setOrders(data || []);
        setIsUsingSupabase(true);
      } catch (err) {
        console.error("Supabase load failed in DealsTable, falling back to LocalStorage:", err);
        loadLocalStorage();
      }
    } else {
      loadLocalStorage();
    }
    setLoading(false);
  }, []);

  const loadLocalStorage = () => {
    setIsUsingSupabase(false);
    const local = localStorage.getItem("berakit_transactions");
    if (local) {
      setOrders(JSON.parse(local).slice(0, 10));
    } else {
      localStorage.setItem("berakit_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
      setOrders(DEFAULT_TRANSACTIONS.slice(0, 10));
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, [loadData]);

  const handleUpdateStatus = async (id: string, newStatus: Transaction["status"]) => {
    if (isUsingSupabase) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", id);

        if (error) throw error;
        await loadData();
      } catch (err) {
        console.error("Gagal update status di Supabase:", err);
        alert("Gagal memperbarui status transaksi.");
      }
    } else {
      // Local fallbacks
      const local = localStorage.getItem("berakit_transactions");
      let allTx: Transaction[] = [];
      if (local) {
        allTx = JSON.parse(local);
      } else {
        allTx = DEFAULT_TRANSACTIONS;
      }

      const updated = allTx.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      );
      localStorage.setItem("berakit_transactions", JSON.stringify(updated));
      setOrders(updated.slice(0, 10));
    }
  };

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) =>
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "Selesai":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 gap-1 border-emerald-500/20 font-medium">
            <CheckCircle2 className="size-3" />
            Selesai
          </Badge>
        );
      case "Diproses":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 gap-1 border-blue-500/20 font-medium">
            <TrendingUp className="size-3" />
            Diproses
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 gap-1 border-amber-500/20 font-medium">
            <Clock className="size-3" />
            Pending
          </Badge>
        );
      case "Dibatalkan":
        return (
          <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 gap-1 border-rose-500/20 font-medium">
            <Ban className="size-3" />
            Batal
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border-b">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Pesanan Terbaru</h2>
            <p className="text-[11px] text-muted-foreground">Menampilkan hingga 10 transaksi teranyar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari pembeli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 sm:h-9 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={loadData}>
            <RefreshCw className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto p-2 sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Memuat pesanan terbaru...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Tidak ada pesanan masuk.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Pembeli</TableHead>
                <TableHead className="hidden md:table-cell">Alamat Kirim</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Total Belanja</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-semibold text-xs sm:text-sm block">{order.customer_name}</span>
                    <span className="text-[10px] text-muted-foreground block">{order.customer_phone}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] text-xs text-muted-foreground truncate">
                    {order.address}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {order.payment_method}
                  </TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm tabular-nums">
                    Rp {order.total_amount.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Diproses")}>
                          <TrendingUp className="size-4 mr-2 text-blue-500" />
                          Tandai Diproses
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Selesai")}>
                          <CheckCircle2 className="size-4 mr-2 text-emerald-500" />
                          Tandai Selesai
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "Dibatalkan")}>
                          <Ban className="size-4 mr-2 text-rose-500" />
                          Tandai Batal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
