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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addActivityLog } from "@/lib/logger";
import { toast } from "sonner";
import { useDashboardStore } from "@/store/dashboard-store";

interface Complaint {
  id: string;
  user_id: string;
  order_id: string;
  type: string;
  description: string;
  proof_url?: string | null;
  status: string;
  admin_response?: string | null;
  created_at: string;
}

export function ComplaintsList() {
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);

  // Detail & Response Dialog
  const [selectedTicket, setSelectedTicket] = React.useState<Complaint | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminResponse, setAdminResponse] = React.useState("");
  const [ticketStatus, setTicketStatus] = React.useState("Menunggu Review");
  const [updateLoading, setUpdateLoading] = React.useState(false);

  // Delete Dialog
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingTicket, setDeletingTicket] = React.useState<Complaint | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const loadComplaints = React.useCallback(async () => {
    setLoading(true);
    let list: Complaint[] = [];
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          list = data;
        }
      } catch (err) {
        console.warn("Failed fetching complaints from Supabase:", err);
      }
    }

    // Load from local storage
    try {
      // Find all keys matching berakit_complaints_
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("berakit_complaints_")) {
          const dataStr = localStorage.getItem(key);
          if (dataStr) {
            const localData = JSON.parse(dataStr) as Complaint[];
            localData.forEach((lc) => {
              if (!list.some((c) => c.id === lc.id)) {
                list.push(lc);
              }
            });
          }
        }
      });
    } catch (e) {
      console.error("Failed loading local complaints:", e);
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setComplaints(list);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Filtered tickets
  const filteredComplaints = complaints.filter((ticket) => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdateLoading(true);
    const updatedTicket = {
      ...selectedTicket,
      status: ticketStatus,
      admin_response: adminResponse || null,
    };

    let dbSuccess = false;
    if (supabase) {
      try {
        const { error } = await supabase
          .from("complaints")
          .update({
            status: ticketStatus,
            admin_response: adminResponse || null,
          })
          .eq("id", selectedTicket.id);

        if (!error) {
          dbSuccess = true;
          addActivityLog(
            "Update Tiket Komplain",
            `Mengupdate status tiket #${selectedTicket.id.substring(0, 8)} menjadi '${ticketStatus}'`,
            "system"
          );
        }
      } catch (err) {
        console.warn("Failed updating complaint in database:", err);
      }
    }

    // Fallback/Mirror local storage
    try {
      const localKey = `berakit_complaints_${selectedTicket.user_id}`;
      const existingStr = localStorage.getItem(localKey);
      if (existingStr) {
        const existing = JSON.parse(existingStr) as Complaint[];
        const idx = existing.findIndex((c) => c.id === selectedTicket.id);
        if (idx > -1) {
          existing[idx] = updatedTicket;
          localStorage.setItem(localKey, JSON.stringify(existing));
        }
      }

      setComplaints((prev) =>
        prev.map((c) => (c.id === selectedTicket.id ? updatedTicket : c))
      );

      toast.success(
        dbSuccess
          ? "Status tiket komplain berhasil diperbarui!"
          : "Status tiket komplain diperbarui secara lokal."
      );
      setIsDetailsOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui tiket.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deletingTicket) return;

    setDeleteLoading(true);
    let dbSuccess = false;
    if (supabase) {
      try {
        const { error } = await supabase
          .from("complaints")
          .delete()
          .eq("id", deletingTicket.id);

        if (!error) {
          dbSuccess = true;
          addActivityLog(
            "Hapus Tiket Komplain",
            `Menghapus tiket komplain #${deletingTicket.id.substring(0, 8)}`,
            "system"
          );
        }
      } catch (err) {
        console.warn("Failed deleting complaint from database:", err);
      }
    }

    // Mirror/Fallback local storage
    try {
      const localKey = `berakit_complaints_${deletingTicket.user_id}`;
      const existingStr = localStorage.getItem(localKey);
      if (existingStr) {
        const existing = JSON.parse(existingStr) as Complaint[];
        const filtered = existing.filter((c) => c.id !== deletingTicket.id);
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }

      setComplaints((prev) => prev.filter((c) => c.id !== deletingTicket.id));
      toast.success(
        dbSuccess
          ? "Tiket komplain berhasil dihapus!"
          : "Tiket komplain dihapus secara lokal."
      );
      setIsDeleteOpen(false);
      setDeletingTicket(null);
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus tiket.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header controls (Navbar style) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-zinc-200 dark:border-zinc-800 pb-0">
        {/* Status filters like a Navbar */}
        <div className="flex gap-6 overflow-x-auto scrollbar-none -mb-[1.5px]">
          {[
            { id: "all", label: "Semua Keluhan" },
            { id: "Menunggu Review", label: "Menunggu" },
            { id: "Diproses", label: "Diproses" },
            { id: "Selesai", label: "Selesai" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`pb-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 shrink-0 ${
                  isActive
                    ? "border-black dark:border-white text-zinc-950 dark:text-white font-black"
                    : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:max-w-xs pb-2 sm:pb-0 sm:-mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keluhan..."
            className="pl-9 h-8 text-xs rounded-xl border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:border-zinc-400"
          />
        </div>
      </div>

      {/* Main content table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 animate-spin text-zinc-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Memuat data pengaduan...</span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="size-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-xs text-zinc-500 font-bold">Tidak ada data pengaduan / komplain ditemukan.</p>
            <p className="text-[10px] text-zinc-400 mt-1">Coba sesuaikan kata kunci atau filter status pencarian Anda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/40">
              <TableRow>
                <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-wider text-zinc-400">ID Tiket</TableHead>
                <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-wider text-zinc-400">ID Pesanan</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Jenis Masalah</TableHead>
                <TableHead className="w-[130px] text-[10px] font-black uppercase tracking-wider text-zinc-400">Tanggal Masuk</TableHead>
                <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-wider text-zinc-400">Status</TableHead>
                <TableHead className="w-[110px] text-right text-[10px] font-black uppercase tracking-wider text-zinc-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10">
                  <TableCell className="font-mono text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                    {ticket.id.substring(0, 14)}...
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-zinc-500">
                    #{ticket.order_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {ticket.type}
                  </TableCell>
                  <TableCell className="text-[11px] text-zinc-500 font-medium">
                    {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 border-none ${
                        ticket.status === "Selesai"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : ticket.status === "Diproses"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400"
                      }`}
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setAdminResponse(ticket.admin_response || "");
                          setTicketStatus(ticket.status);
                          setIsDetailsOpen(true);
                        }}
                        className="size-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                      >
                        <Eye className="size-3.5 text-zinc-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingTicket(ticket);
                          setIsDeleteOpen(true);
                        }}
                        className="size-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Ticket Details & Action Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[460px] border-border/85 bg-white dark:bg-zinc-950 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <MessageSquare className="size-4.5 text-indigo-500" />
              Detail & Tanggapi Pengaduan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-450 dark:text-zinc-500 pt-1">
              Periksa keluhan dari pembeli dan berikan tanggapan untuk menyelesaikan masalah.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <form onSubmit={handleUpdateTicket} className="space-y-4 text-left py-2">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border text-xs space-y-2">
                <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">ID Tiket:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-150">{selectedTicket.id}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">ID Transaksi:</span>
                  <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">#{selectedTicket.order_id}</span>
                </div>
                <div className="flex justify-between border-b pb-2 dark:border-zinc-800">
                  <span className="text-zinc-500">Jenis Masalah:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedTicket.type}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 block">Rincian Deskripsi:</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                    {selectedTicket.description}
                  </p>
                </div>
                {selectedTicket.proof_url && (
                  <div className="space-y-1 pt-1">
                    <span className="text-zinc-500 block">Bukti Gambar / Foto:</span>
                    <a
                      href={selectedTicket.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-500 font-bold hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Lihat Foto Bukti Fullsize
                    </a>
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-250 dark:border-zinc-800 shadow-xs">
                      <img src={selectedTicket.proof_url} alt="Bukti Lampiran" className="size-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Update Status Penanganan</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
                >
                  <option value="Menunggu Review">Menunggu Review</option>
                  <option value="Diproses">Diproses / Penanganan</option>
                  <option value="Selesai">Selesai / Ditutup</option>
                </select>
              </div>

              {/* Tanggapan Admin */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Tulis Tanggapan Resmi</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Tulis solusi, penjelasan, atau intruksi tindak lanjut untuk pembeli..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:outline-none focus:border-zinc-400 transition-all font-semibold resize-none"
                />
              </div>

              <DialogFooter className="pt-3 border-t mt-1 gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="h-9 text-xs font-bold uppercase tracking-wider border rounded-full cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={updateLoading}
                  className="h-9 text-xs font-black uppercase tracking-wider bg-black dark:bg-zinc-900 text-white hover:opacity-90 rounded-full cursor-pointer"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 className="size-3 animate-spin mr-1.5" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Tanggapan</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-[380px] border-border/85 bg-white dark:bg-zinc-950 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-rose-500">
              <AlertTriangle className="size-4.5" />
              Hapus Tiket Komplain?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-450 dark:text-zinc-500 pt-1">
              Tindakan ini permanen dan akan menghapus tiket pengaduan dari sistem.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t mt-1 gap-2 sm:gap-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="h-9 text-xs font-bold uppercase tracking-wider border rounded-full cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteTicket}
              disabled={deleteLoading}
              className="h-9 text-xs font-black uppercase tracking-wider bg-rose-500 text-white hover:bg-rose-600 rounded-full cursor-pointer"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
