"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  Trash2,
  Search,
  ShoppingBag,
  CreditCard,
  Settings,
  Database,
  Download,
  RefreshCw,
  User,
} from "lucide-react";
import { getActivityLogs, clearActivityLogs, ActivityLog } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const logTypeConfig = {
  product: {
    icon: ShoppingBag,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    label: "Produk",
  },
  transaction: {
    icon: CreditCard,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    label: "Transaksi",
  },
  settings: {
    icon: Settings,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    label: "Pengaturan",
  },
  system: {
    icon: Database,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    label: "Sistem",
  },
};

export function ActivityLogs() {
  const [logs, setLogs] = React.useState<ActivityLog[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);

  const loadLogs = React.useCallback(() => {
    setLogs(getActivityLogs());
  }, []);

  React.useEffect(() => {
    loadLogs();

    // Listen for real-time log updates from other components
    window.addEventListener("activity_logs_updated", loadLogs);
    return () => {
      window.removeEventListener("activity_logs_updated", loadLogs);
    };
  }, [loadLogs]);

  const handleClear = () => {
    clearActivityLogs();
    setIsClearDialogOpen(false);
    toast.success("Seluruh riwayat aktivitas berhasil dihapus.");
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["ID", "Aksi", "Detail", "Tipe", "Tanggal", "Admin"];
    const rows = logs.map((log) => [
      log.id,
      log.action,
      log.details.replace(/"/g, '""'), // escape quotes
      log.type,
      new Date(log.timestamp).toLocaleString("id-ID"),
      log.adminName,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `riwayat_aktivitas_bumdes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to format friendly relative time
  const formatFriendlyTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / (3600000 * 24));

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari lalu`;
      
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Beberapa waktu lalu";
    }
  };

  // Filter logs based on search query and type filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.adminName.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedType === "all" || log.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="rounded-xl border bg-card">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Riwayat Aktivitas</h2>
            <p className="text-[11px] text-muted-foreground">Lacak dan audit semua tindakan operasional admin BUMDes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsClearDialogOpen(true)}
            disabled={logs.length === 0}
            className="gap-1.5 h-8 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Riwayat
          </Button>
        </div>
      </div>

      {/* 2. Control Bar (Search & Filter) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 border-b bg-muted/20">
        <div className="relative w-full md:w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari aktivitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs focus-visible:ring-[#6e3ff3]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "Semua" },
            { id: "product", label: "Produk" },
            { id: "transaction", label: "Transaksi" },
            { id: "settings", label: "Pengaturan" },
            { id: "system", label: "Sistem" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                selectedType === type.id
                  ? "bg-[#6e3ff3] text-white border-[#6e3ff3] shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Timeline / Logs List */}
      <div className="p-4 sm:p-5">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="h-8 w-8 text-muted-foreground/50 stroke-[1.5] mb-2" />
            <h3 className="text-xs font-semibold">Tidak Ada Riwayat</h3>
            <p className="text-[10px] text-muted-foreground max-w-[240px] mt-0.5">
              Tidak ada log aktivitas yang cocok dengan kata kunci pencarian atau filter.
            </p>
          </div>
        ) : (
          <div className="relative pl-5 border-l border-border ml-2 space-y-4">
            {filteredLogs.map((log) => {
              const config = logTypeConfig[log.type] || logTypeConfig.system;
              const Icon = config.icon;

              return (
                <div key={log.id} className="relative group">
                  {/* Circle Dot with Icon */}
                  <div
                    className={`absolute -left-[33px] top-0.5 p-1 rounded-full border shadow-xs transition-all duration-300 group-hover:scale-105 flex items-center justify-center ${config.color}`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>

                  {/* Content Box */}
                  <div className="p-3.5 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground tracking-tight">{log.action}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-background uppercase tracking-wider text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatFriendlyTime(log.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      {log.details}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/30 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                      <User className="h-2.5 w-2.5" />
                      <span>Pelaku:</span>
                      <span className="text-foreground">{log.adminName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-[400px] border-border/80">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-500">
              <Trash2 className="h-4 w-4" />
              Hapus Riwayat Aktivitas
            </DialogTitle>
            <DialogDescription className="text-xs mt-2 text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh riwayat aktivitas admin? Tindakan ini permanen dan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearDialogOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="text-xs"
            >
              Hapus Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
