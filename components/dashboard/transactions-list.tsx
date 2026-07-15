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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Trash2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { supabase, withTimeout, handleSupabaseError } from "@/lib/supabase";
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
  receipt_url?: string | null;
  created_at: string;
  items?: any;
}

import { useDashboardStore } from "@/store/dashboard-store";

export function TransactionsList() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(!!supabase);
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Details dialog states
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // Delete confirmation dialog states
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingTx, setDeletingTx] = React.useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

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

        setTransactions(data || []);
        setIsUsingSupabase(true);
      } catch (err) {
        handleSupabaseError("TransactionsList.loadData", err);
        setTransactions([]);
        setIsUsingSupabase(false);
      }
    } else {
      setIsUsingSupabase(false);
      setTransactions([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (id: string, newStatus: Transaction["status"]) => {
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error("Pembaruan status diblokir oleh kebijakan keamanan RLS Supabase.");
        }

        addActivityLog(
          "Update Status Transaksi",
          `Mengubah status transaksi #${id} menjadi '${newStatus}' (Supabase)`,
          "transaction"
        );
        toast.success(`Status transaksi #${id} berhasil diubah menjadi '${newStatus}'`);
        await loadData();
      } catch (err: any) {
        console.error("Gagal update status di Supabase:", err);
        toast.error("Gagal memperbarui status transaksi: " + (err.message || err));
      }
    } else {
      toast.error("Supabase tidak tersambung. Aksi dibatalkan.");
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

  const handleDeleteClick = (tx: Transaction) => {
    setDeletingTx(tx);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;

    setDeleteLoading(true);
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .delete()
          .eq("id", deletingTx.id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error("Penghapusan diblokir oleh kebijakan keamanan RLS Supabase.");
        }

        addActivityLog(
          "Hapus Transaksi",
          `Menghapus data transaksi #${deletingTx.id} dari pembeli '${deletingTx.customer_name}' (Supabase)`,
          "transaction"
        );
        toast.success(`Transaksi pembeli '${deletingTx.customer_name}' berhasil dihapus.`);
        setIsDeleteOpen(false);
        setDeletingTx(null);
        await loadData();
      } catch (err: any) {
        console.error("Gagal menghapus transaksi di Supabase:", err);
        toast.error("Gagal menghapus transaksi: " + (err.message || err));
      }
    } else {
      toast.error("Supabase tidak tersambung. Aksi dibatalkan.");
    }
    setDeleteLoading(false);
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
                    <TableCell className="text-xs font-medium">
                      <div className="text-muted-foreground">{tx.payment_method}</div>
                      {tx.receipt_url && (
                        <a 
                          href={tx.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold block mt-1 transition-colors"
                        >
                          Lihat Bukti Transfer ↗
                        </a>
                      )}
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
                          <DropdownMenuItem onClick={() => { setSelectedTx(tx); setIsDetailsOpen(true); }} className="cursor-pointer">
                            <Eye className="size-4 mr-2 text-muted-foreground" />
                            Detail Pesanan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tx.status !== "Selesai" && tx.status !== "Dibatalkan" && (
                            <>
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
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleWhatsAppContact(tx)} className="text-emerald-600 hover:text-emerald-600 focus:text-emerald-600 cursor-pointer">
                            <MessageSquare className="size-4 mr-2 text-emerald-500" />
                            Hubungi WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(tx)} 
                            className="text-rose-600 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="size-4 mr-2 text-rose-500" />
                            Hapus Transaksi
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-[400px] border-border/80">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-500">
              <AlertTriangle className="size-4 shrink-0" />
              Hapus Data Transaksi?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Tindakan ini akan menghapus data transaksi pembeli{" "}
              <strong className="text-foreground font-semibold">
                {deletingTx?.customer_name}
              </strong>{" "}
              sebesar{" "}
              <strong className="text-[#6e3ff3] font-bold">
                Rp {deletingTx?.total_amount.toLocaleString("id-ID")}
              </strong>{" "}
              secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2.5 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleteLoading}
              onClick={() => setIsDeleteOpen(false)}
              className="h-8 text-xs font-semibold px-3 py-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading}
              onClick={handleConfirmDelete}
              className="h-8 text-xs font-semibold px-3.5 py-1 gap-1.5"
            >
              {deleteLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
              {deleteLoading ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md border-border/80">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              Detail Rincian Pesanan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-0.5">
              ID Transaksi: <span className="font-mono text-foreground font-semibold">{selectedTx?.id}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4 py-2 text-left">
              {/* Customer Info Card */}
              <div className="bg-muted/30 p-3 rounded-lg border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Pelanggan:</span>
                  <span className="font-semibold text-foreground">{selectedTx.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Telepon:</span>
                  <span className="font-semibold text-foreground">{selectedTx.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Pembayaran:</span>
                  <span className="font-semibold text-foreground">{selectedTx.payment_method}</span>
                </div>
                <div className="flex flex-col pt-1 border-t border-dashed mt-1.5">
                  <span className="text-muted-foreground mb-0.5">Alamat Pengiriman:</span>
                  <span className="text-foreground leading-normal font-medium">{selectedTx.address}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Produk Yang Dipesan</span>
                <div className="border rounded-lg overflow-hidden divide-y bg-white dark:bg-zinc-950">
                  {(() => {
                    let itemsArray: any[] = [];
                    if (typeof selectedTx.items === "string") {
                      try {
                        itemsArray = JSON.parse(selectedTx.items);
                      } catch (e) {
                        itemsArray = [];
                      }
                    } else if (Array.isArray(selectedTx.items)) {
                      itemsArray = selectedTx.items;
                    }

                    if (itemsArray.length === 0) {
                      return <div className="p-3 text-xs text-muted-foreground text-center">Rincian produk tidak tersedia.</div>;
                    }

                    return itemsArray.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs">
                        <div className="space-y-0.5 max-w-[240px]">
                          <span className="font-semibold text-foreground block leading-tight">{item.name}</span>
                          {item.selected_size && (
                            <span className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase mt-0.5">
                              Ukuran/Dimensi: {item.selected_size}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-medium text-foreground block">{item.quantity} x Rp {(item.price || 0).toLocaleString("id-ID")}</span>
                          <span className="font-bold text-primary block">Rp {((item.price || 0) * item.quantity).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Subtotal & Total */}
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Pembayaran</span>
                <span className="text-base font-black text-foreground tabular-nums">
                  Rp {selectedTx.total_amount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="h-8 text-xs font-semibold px-4 cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
