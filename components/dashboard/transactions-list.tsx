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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  CreditCard,
  Loader2,
  ClipboardList,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { supabase, withTimeout } from "@/lib/supabase";
import { addActivityLog } from "@/lib/logger";
import { LoadingLottie } from "@/components/ui/loading-lottie";
import { toast } from "sonner";

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

export function TransactionsList() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Check Supabase credentials & load data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;

    if (hasCredentials) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
        );

        if (error) throw error;

        if (data && data.length === 0) {
          // Auto-seed default transactions to make the database instantly alive
          const seedData = DEFAULT_TRANSACTIONS.map(({ customer_name, customer_phone, address, total_amount, status, payment_method, created_at }) => ({
            customer_name, customer_phone, address, total_amount, status, payment_method, created_at
          }));
          const { error: seedError } = await supabase.from("orders").insert(seedData);
          if (!seedError) {
            const { data: refetched } = await withTimeout(
              supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false })
            );
            setTransactions(refetched || []);
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions(data || []);
        }
        setIsUsingSupabase(true);
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to LocalStorage:", err);
        loadLocalStorage();
      }
    } else {
      loadLocalStorage();
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const loadLocalStorage = () => {
    setIsUsingSupabase(false);
    const local = localStorage.getItem("berakit_transactions");
    if (local) {
      setTransactions(JSON.parse(local));
    } else {
      localStorage.setItem("berakit_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
      setTransactions(DEFAULT_TRANSACTIONS);
    }
  };

  // Update transaction status
  const handleUpdateStatus = async (id: string, newStatus: Transaction["status"]) => {
    if (isUsingSupabase) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", id);

        if (error) throw error;
        addActivityLog(
          "Update Status Transaksi",
          `Mengubah status transaksi #${id} menjadi '${newStatus}' (Supabase)`,
          "transaction"
        );
        toast.success(`Status transaksi #${id} berhasil diubah menjadi '${newStatus}'`);
        await loadData();
      } catch (err) {
        console.error("Gagal update status di Supabase:", err);
        toast.error("Gagal memperbarui status transaksi.");
      }
    } else {
      const updated = transactions.map((t) =>
        t.id === id ? { ...t, status: newStatus } : t
      );
      setTransactions(updated);
      localStorage.setItem("berakit_transactions", JSON.stringify(updated));
      addActivityLog(
        "Update Status Transaksi",
        `Mengubah status transaksi #${id} menjadi '${newStatus}' (Lokal)`,
        "transaction"
      );
      toast.success(`Status transaksi #${id} berhasil diubah menjadi '${newStatus}' (Lokal)`);
    }
  };

  const handleWhatsAppContact = (order: Transaction) => {
    let phone = (order.customer_phone || "").replace(/\D/g, "");
    if (!phone) {
      toast.error("Nomor telepon tidak valid.");
      return;
    }
    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    } else if (!phone.startsWith("62")) {
      phone = "62" + phone;
    }

    const message = `Halo ${order.customer_name},\n\nKami dari *BUMDes Berakit Maju*. Mengonfirmasi pesanan Anda:\n- Status: *${order.status}*\n- Total Belanja: *Rp ${order.total_amount.toLocaleString("id-ID")}*\n- Alamat: ${order.address}\n\nTerima kasih telah berbelanja produk desa kami!`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    addActivityLog(
      "Hubungi Pelanggan",
      `Mengirim pesan WhatsApp konfirmasi ke pelanggan '${order.customer_name}' untuk transaksi #${order.id}`,
      "transaction"
    );
    window.open(url, "_blank");
  };

  // Filtered transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  // Total sales calculation
  const totalRevenue = React.useMemo(() => {
    return transactions
      .filter((t) => t.status === "Selesai")
      .reduce((sum, t) => sum + t.total_amount, 0);
  }, [transactions]);

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
    <div className="space-y-4">
      {/* Revenue Tracker Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Pendapatan Berhasil</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-500 tabular-nums">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CreditCard className="size-5" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Total Transaksi</span>
            <p className="text-xl sm:text-2xl font-bold tabular-nums">{transactions.length}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Transaksi Jualan Desa</h2>
              <p className="text-[11px] text-muted-foreground">Kelola pesanan masuk dari pembeli</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama/metode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 sm:h-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 sm:h-9 w-[130px] text-sm">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Diproses">Diproses</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto p-2 sm:p-4">
          {loading ? (
            <LoadingLottie size={100} label="Memuat data transaksi..." />
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <ClipboardList className="size-12 text-muted-foreground/60" />
              <div>
                <h3 className="font-semibold text-sm">Tidak ada transaksi ditemukan</h3>
                <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan pencarian atau status filter.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Pembeli</TableHead>
                  <TableHead className="hidden md:table-cell">Alamat</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Total Belanja</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span className="font-medium text-sm block">{tx.customer_name}</span>
                      <span className="text-[11px] text-muted-foreground block">{tx.customer_phone}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] text-xs text-muted-foreground truncate">
                      {tx.address}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {tx.payment_method}
                    </TableCell>
                    <TableCell className="font-medium text-sm tabular-nums">
                      Rp {tx.total_amount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "Diproses")}>
                            <TrendingUp className="size-4 mr-2 text-blue-500" />
                            Tandai Diproses
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "Selesai")}>
                            <CheckCircle2 className="size-4 mr-2 text-emerald-500" />
                            Tandai Selesai
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "Dibatalkan")}>
                            <Ban className="size-4 mr-2 text-rose-500" />
                            Tandai Batal / Reject
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleWhatsAppContact(tx)} className="text-emerald-600 hover:text-emerald-600 focus:text-emerald-600 cursor-pointer">
                            <MessageSquare className="size-4 mr-2 text-emerald-500" />
                            Hubungi WhatsApp
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
    </div>
  );
}
