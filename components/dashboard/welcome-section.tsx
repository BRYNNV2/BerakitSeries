"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  status: string;
}

export function WelcomeSection() {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const loadPendingCount = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;
    let transactions: Transaction[] = [];

    if (hasCredentials) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("status")
          .eq("status", "Pending");
        
        if (error) throw error;
        setPendingCount(data?.length || 0);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Failed to load pending count from Supabase:", err);
      }
    }

    // Local fallback
    const local = localStorage.getItem("berakit_transactions");
    if (local) {
      transactions = JSON.parse(local);
    } else {
      // Default placeholder data contains 1 pending order
      transactions = [
        { status: "Pending" }
      ];
    }
    setPendingCount(transactions.filter((t) => t.status === "Pending").length);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadPendingCount();
    window.addEventListener("focus", loadPendingCount);
    return () => window.removeEventListener("focus", loadPendingCount);
  }, [loadPendingCount]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-[22px] font-bold leading-tight tracking-tight">
          Selamat Datang, Admin BUMDes Berakit!
        </h2>
        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Memeriksa status pesanan...</span>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Hari ini ada{" "}
            <span className="text-foreground font-semibold underline decoration-primary decoration-2 underline-offset-2">
              {pendingCount} pesanan baru
            </span>{" "}
            yang memerlukan konfirmasi Anda.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-8 sm:h-9 text-xs sm:text-sm">
              <span>Laporan</span>
              <ChevronDown className="size-3 sm:size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Upload className="size-4 mr-2" />
              Impor CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="size-4 mr-2" />
              Ekspor CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="size-4 mr-2" />
              Cetak PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
