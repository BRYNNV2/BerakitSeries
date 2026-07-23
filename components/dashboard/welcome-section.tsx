"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Download,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Filter,
  Printer,
} from "lucide-react";
import { supabase, withTimeout } from "@/lib/supabase";

interface Transaction {
  status: string;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
  total_amount?: number;
  payment_method?: string;
  created_at?: string;
}

interface Product {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
}

export function WelcomeSection() {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Import Dialog State
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importType, setImportType] = React.useState<"products" | "transactions">("products");
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importError, setImportError] = React.useState("");
  const [importSuccess, setImportSuccess] = React.useState("");

  // PDF Report Dialog & Date Range States
  const [isPdfModalOpen, setIsPdfModalOpen] = React.useState(false);
  const [datePreset, setDatePreset] = React.useState<"all" | "today" | "7days" | "month" | "30days" | "custom">("month");
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [pdfStatusFilter, setPdfStatusFilter] = React.useState("all");
  const [pdfLoading, setPdfLoading] = React.useState(false);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset as any);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7days") {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 7);
      setStartDate(d7.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === "30days") {
      const d30 = new Date(today);
      d30.setDate(d30.getDate() - 30);
      setStartDate(d30.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const loadPendingCount = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;
    let transactions: Transaction[] = [];

    if (hasCredentials) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("orders")
            .select("status")
            .eq("status", "Pending")
        );

        if (error) throw error;
        setPendingCount(data?.length || 0);
        setLoading(false);
        return;
      } catch (err) {
        console.warn("Failed to load pending count from Supabase:", err);
      }
    }

    // Local fallback
    const local = localStorage.getItem("berakit_transactions");
    if (local) {
      transactions = JSON.parse(local);
    } else {
      transactions = [{ status: "Pending" }];
    }
    setPendingCount(transactions.filter((t) => t.status === "Pending").length);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);

  // Fetch all products and transactions utility
  const fetchAllData = async () => {
    let products: Product[] = [];
    let transactions: Transaction[] = [];

    // Fetch Products
    if (supabase) {
      try {
        const { data, error } = await withTimeout(supabase.from("products").select("*"));
        if (!error && data) {
          products = data;
        }
      } catch (err) {
        console.warn("Supabase product fetch error:", err);
      }
    }
    if (products.length === 0) {
      const localProducts = localStorage.getItem("berakit_products");
      if (localProducts) products = JSON.parse(localProducts);
    }

    // Fetch Transactions
    if (supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
        );
        if (!error && data) {
          transactions = data;
        }
      } catch (err) {
        console.warn("Supabase orders fetch error:", err);
      }
    }
    if (transactions.length === 0) {
      const localTransactions = localStorage.getItem("berakit_transactions");
      if (localTransactions) transactions = JSON.parse(localTransactions);
    }

    return { products, transactions };
  };

  // CSV Template download helper
  const handleDownloadTemplate = (type: "products" | "transactions") => {
    const csvContent =
      type === "products"
        ? '"name","description","price","stock","category","image_url"\n"Batik Tulis Biota Laut","Batik tulis eksklusif motif terumbu karang",450000,12,"Batik Tulis","https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500"\n"Batik Cap Mangrove","Batik cap motif daun mangrove modern",195000,24,"Batik Cap","https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500"'
        : '"customer_name","customer_phone","address","total_amount","status","payment_method"\n"Budi Nelayan","081270012345","RT 02 RW 01, Desa Berakit Bintan",120000,"Selesai","Transfer Bank"\n"Siti Rahma","087799887766","Jl. Pantai Indah, Dusun 3 Berakit",35000,"Pending","COD"';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Template_Impor_${type === "products" ? "Produk" : "Transaksi"}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV Export helper
  const handleExportCsv = async (type: "products" | "transactions") => {
    const { products, transactions } = await fetchAllData();

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = "";

    if (type === "products") {
      const headers = ["name", "description", "price", "stock", "category", "image_url"];
      csvContent += headers.join(",") + "\n";
      products.forEach((p) => {
        const row = [
          escapeCsv(p.name),
          escapeCsv(p.description || ""),
          p.price,
          p.stock,
          escapeCsv(p.category || ""),
          escapeCsv(p.image_url || ""),
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      const headers = ["customer_name", "customer_phone", "address", "total_amount", "status", "payment_method", "created_at"];
      csvContent += headers.join(",") + "\n";
      transactions.forEach((t) => {
        const row = [
          escapeCsv(t.customer_name),
          escapeCsv(t.customer_phone || ""),
          escapeCsv(t.address || ""),
          t.total_amount || 0,
          escapeCsv(t.status || "Pending"),
          escapeCsv(t.payment_method || "COD"),
          escapeCsv(t.created_at || ""),
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Ekspor_BUMDes_${type === "products" ? "Produk" : "Transaksi"}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import parser
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Silakan seret atau pilih file CSV terlebih dahulu.");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportSuccess("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File tidak dapat dibaca atau kosong.");

        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
        if (lines.length < 2) {
          throw new Error("File CSV tidak valid. Harus menyertakan minimal 1 baris tajuk (headers) dan 1 baris data.");
        }

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result.map((v) => v.replace(/^"|"$/g, ""));
        };

        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
        const rawRows = lines.slice(1).map(parseCSVLine);

        if (importType === "products") {
          const nameIdx = headers.indexOf("name");
          const descIdx = headers.indexOf("description");
          const priceIdx = headers.indexOf("price");
          const stockIdx = headers.indexOf("stock");
          const catIdx = headers.indexOf("category");
          const imgIdx = headers.indexOf("image_url");

          if (nameIdx === -1 || priceIdx === -1 || stockIdx === -1) {
            throw new Error("Format kolom salah. Wajib mencakup header kolom: 'name', 'price', dan 'stock'.");
          }

          const parsedProducts: Product[] = rawRows.map((row, index) => {
            const name = row[nameIdx];
            const price = Number(row[priceIdx]);
            const stock = Number(row[stockIdx]);

            if (!name || isNaN(price) || isNaN(stock)) {
              throw new Error(`Data baris ke-${index + 1} cacat. Wajib mencakup nama, serta harga dan stok berupa angka.`);
            }

            return {
              name,
              description: descIdx !== -1 ? row[descIdx] : "",
              price,
              stock,
              category: catIdx !== -1 && row[catIdx] ? row[catIdx] : "Batik Tulis",
              image_url: imgIdx !== -1 && row[imgIdx] ? row[imgIdx] : "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500",
            };
          });

          if (supabase) {
            const { error } = await supabase.from("products").insert(parsedProducts);
            if (error) throw new Error("Gagal mengunggah ke database online: " + error.message);
          } else {
            const localProducts = localStorage.getItem("berakit_products");
            const existing = localProducts ? JSON.parse(localProducts) : [];
            localStorage.setItem("berakit_products", JSON.stringify([...existing, ...parsedProducts]));
          }

          setImportSuccess(`Berhasil mengimpor ${parsedProducts.length} produk baru! Halaman akan dimuat ulang.`);
        } else {
          // Transactions import
          const custNameIdx = headers.indexOf("customer_name");
          const phoneIdx = headers.indexOf("customer_phone");
          const addrIdx = headers.indexOf("address");
          const amtIdx = headers.indexOf("total_amount");
          const statusIdx = headers.indexOf("status");
          const payIdx = headers.indexOf("payment_method");

          if (custNameIdx === -1 || amtIdx === -1) {
            throw new Error("Format kolom salah. Wajib mencakup header kolom: 'customer_name' dan 'total_amount'.");
          }

          const parsedTransactions: Transaction[] = rawRows.map((row, index) => {
            const customer_name = row[custNameIdx];
            const total_amount = Number(row[amtIdx]);

            if (!customer_name || isNaN(total_amount)) {
              throw new Error(`Data baris ke-${index + 1} cacat. Wajib mencakup nama pelanggan dan total belanja berupa angka.`);
            }

            return {
              customer_name,
              customer_phone: phoneIdx !== -1 ? row[phoneIdx] : "",
              address: addrIdx !== -1 ? row[addrIdx] : "Desa Berakit",
              total_amount,
              status: statusIdx !== -1 && row[statusIdx] ? row[statusIdx] : "Pending",
              payment_method: payIdx !== -1 && row[payIdx] ? row[payIdx] : "COD",
              created_at: new Date().toISOString(),
            };
          });

          if (supabase) {
            const { error } = await supabase.from("orders").insert(parsedTransactions);
            if (error) throw new Error("Gagal mengunggah ke database online: " + error.message);
          } else {
            const localTransactions = localStorage.getItem("berakit_transactions");
            const existing = localTransactions ? JSON.parse(localTransactions) : [];
            localStorage.setItem("berakit_transactions", JSON.stringify([...existing, ...parsedTransactions]));
          }

          setImportSuccess(`Berhasil mengimpor ${parsedTransactions.length} pesanan baru! Halaman akan dimuat ulang.`);
        }

        setImportFile(null);
        setTimeout(() => {
          setIsImportOpen(false);
          setImportSuccess("");
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        console.warn(err);
        setImportError(err.message || "Gagal mengolah berkas CSV.");
      } finally {
        setImportLoading(false);
      }
    };

    reader.readAsText(importFile);
  };

  // Printable Government/Cooperative PDF generator with Date Range Filter
  const handlePrintPdf = async () => {
    setPdfLoading(true);
    const { products, transactions } = await fetchAllData();

    // Default BUMDes details
    let bumdesName = "BUMDes Berakit Maju";
    let bumdesEmail = "bumdes@berakit.desa.id";
    let bumdesPhone = "081234567890";
    let bumdesAddress = "Desa Berakit, Kec. Teluk Sebong, Bintan, Kepulauan Riau";

    const localSettings = localStorage.getItem("berakit_settings");
    if (localSettings) {
      try {
        const settings = JSON.parse(localSettings);
        bumdesName = settings.name || bumdesName;
        bumdesEmail = settings.email || bumdesEmail;
        bumdesPhone = settings.phone || bumdesPhone;
        bumdesAddress = settings.address || bumdesAddress;
      } catch (e) {
        console.warn(e);
      }
    }

    // Filter transactions by Date Range and Status Filter
    const filteredTransactions = transactions.filter((t: any) => {
      // Status filter
      if (pdfStatusFilter !== "all") {
        if (pdfStatusFilter === "Selesai" && t.status !== "Selesai") return false;
        if (pdfStatusFilter === "Pending" && t.status !== "Pending") return false;
        if (pdfStatusFilter === "Dikirim" && !t.status?.startsWith("Dikirim") && t.status !== "Diproses") return false;
      }

      // Date Range filter
      if (t.created_at) {
        const txDateStr = new Date(t.created_at).toISOString().slice(0, 10);
        if (startDate && txDateStr < startDate) return false;
        if (endDate && txDateStr > endDate) return false;
      }

      return true;
    });

    // Calculations
    const totalRevenue = filteredTransactions
      .filter((t: any) => t.status === "Selesai")
      .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
    const completedCount = filteredTransactions.filter((t: any) => t.status === "Selesai").length;
    const pendingCountInPeriod = filteredTransactions.filter((t: any) => t.status === "Pending").length;
    const shippingCountInPeriod = filteredTransactions.filter((t: any) => t.status?.startsWith("Dikirim") || t.status === "Diproses").length;

    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });

    const formatDateFriendly = (dStr: string) => {
      if (!dStr) return "-";
      return new Date(dStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    };

    let periodLabel = "Seluruh Riwayat Transaksi";
    if (startDate && endDate) {
      if (startDate === endDate) {
        periodLabel = `Hari Ini (${formatDateFriendly(startDate)})`;
      } else {
        periodLabel = `${formatDateFriendly(startDate)} s.d. ${formatDateFriendly(endDate)}`;
      }
    } else if (startDate) {
      periodLabel = `Sejak ${formatDateFriendly(startDate)}`;
    } else if (endDate) {
      periodLabel = `Hingga ${formatDateFriendly(endDate)}`;
    }

    const todayPrintStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Generate table rows
    const rowsHtml = filteredTransactions.length === 0
      ? `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280; font-style: italic;">Tidak ada data transaksi ditemukan untuk periode rentang tanggal ini.</td></tr>`
      : filteredTransactions.map((t: any, idx: number) => {
          const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
          let statusBadgeColor = "#3b82f6";
          if (t.status === "Selesai") statusBadgeColor = "#10b981";
          else if (t.status === "Pending") statusBadgeColor = "#f59e0b";
          else if (t.status === "Dibatalkan") statusBadgeColor = "#ef4444";

          return `
            <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px;">
              <td style="padding: 8px 10px; font-family: monospace;">${idx + 1}</td>
              <td style="padding: 8px 10px; font-family: monospace; font-weight: bold;">${t.id}</td>
              <td style="padding: 8px 10px;">${dateStr}</td>
              <td style="padding: 8px 10px; font-weight: 600;">${t.customer_name || "Pelanggan"} <span style="font-size: 9px; color: #6b7280;">(${t.payment_method || "COD"})</span></td>
              <td style="padding: 8px 10px; text-align: center;">
                <span style="display: inline-block; background: ${statusBadgeColor}15; color: ${statusBadgeColor}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid ${statusBadgeColor}40;">
                  ${t.status || "Pending"}
                </span>
              </td>
              <td style="padding: 8px 10px; text-align: right; font-weight: bold;">${formatter.format(t.total_amount || 0)}</td>
            </tr>
          `;
        }).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Penjualan BUMDes Berakit - ${periodLabel}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #111827; background: #fff; margin: 0; padding: 20px; }
            .report-card { max-width: 800px; margin: 0 auto; }
            .header-table { width: 100%; border-bottom: 3px double #111827; padding-bottom: 16px; margin-bottom: 20px; }
            .logo-box { width: 50px; height: 50px; background: #166534; color: white; font-weight: 900; font-size: 24px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
            .brand-name { font-size: 20px; font-weight: 900; color: #166534; letter-spacing: -0.5px; }
            .sub-info { font-size: 11px; color: #4b5563; margin-top: 2px; }
            .report-meta { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .period-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #374151; }
            .period-value { font-size: 13px; font-weight: 900; color: #166534; margin-top: 2px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; }
            .stat-title { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #166534; margin-bottom: 4px; }
            .stat-value { font-size: 14px; font-weight: 900; color: #111827; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th { background: #f3f4f6; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 8px 10px; text-align: left; border: 1px solid #e5e7eb; color: #374151; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
            .sig-box { width: 220px; text-align: center; font-size: 11px; }
            .sig-space { height: 60px; }
          </style>
        </head>
        <body>
          <div class="report-card">
            <table class="header-table">
              <tr>
                <td style="width: 75px; padding-right: 12px; vertical-align: middle;">
                  <img src="/LogoBerakit.png" style="max-height: 60px; max-width: 75px; object-fit: contain; display: block;" alt="Logo BUMDes Berakit" />
                </td>
                <td style="vertical-align: middle;">
                  <div class="brand-name">${bumdesName.toUpperCase()}</div>
                  <div class="sub-brand" style="font-size: 10px; font-weight: 800; color: #6b7280;">UNIT USES PERDAGANGAN BATIK SERIES DESA BERAKIT</div>
                  <div class="sub-info">${bumdesAddress} | Telp: ${bumdesPhone} | Email: ${bumdesEmail}</div>
                </td>
              </tr>
            </table>

            <div class="report-meta">
              <div>
                <div class="period-title">📄 LAPORAN REKAPITULASI PENJUALAN TOKO DESA</div>
                <div class="period-value">PERIODE: ${periodLabel.toUpperCase()}</div>
              </div>
              <div style="text-align: right; font-size: 10.5px; color: #6b7280;">
                <div>Tanggal Cetak: <strong>${todayPrintStr}</strong></div>
                <div>Status Filter: <strong>${pdfStatusFilter === "all" ? "Semua Status" : pdfStatusFilter}</strong></div>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-title">OMSET PENJUALAN</div>
                <div class="stat-value" style="color: #166534;">${formatter.format(totalRevenue)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">TOTAL TRANSAKSI</div>
                <div class="stat-value">${filteredTransactions.length} Pesanan</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">SELESAI (LUNAS)</div>
                <div class="stat-value" style="color: #10b981;">${completedCount} Pesanan</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">PROSES / PENDING</div>
                <div class="stat-value" style="color: #f59e0b;">${pendingCountInPeriod + shippingCountInPeriod} Pesanan</div>
              </div>
            </div>

            <div style="font-size: 10.5px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; color: #374151;">Daftar Rincian Transaksi (${filteredTransactions.length}):</div>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 30px;">NO</th>
                  <th>ID PESANAN</th>
                  <th>TANGGAL</th>
                  <th>NAMA PELANGGAN</th>
                  <th style="text-align: center;">STATUS</th>
                  <th style="text-align: right;">TOTAL BAYAR</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="signatures">
              <div class="sig-box">
                <div>Mengetahui,</div>
                <div style="font-weight: bold; margin-top: 2px;">Kepala Desa Berakit</div>
                <div class="sig-space"></div>
                <div style="font-weight: bold; border-bottom: 1px solid #111827; display: inline-block; padding: 0 15px;">( ________________________ )</div>
              </div>
              <div class="sig-box">
                <div>Berakit, ${todayPrintStr}</div>
                <div style="font-weight: bold; margin-top: 2px;">Direktur BUMDes Berakit Maju</div>
                <div class="sig-space"></div>
                <div style="font-weight: bold; border-bottom: 1px solid #111827; display: inline-block; padding: 0 15px;">( ________________________ )</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Iframe Print Engine (Zero blank window)
    let iframe = document.getElementById("pdf-report-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "pdf-report-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setPdfLoading(false);
        setIsPdfModalOpen(false);
      }, 300);
    } else {
      setPdfLoading(false);
    }
  };

  return (
    <>
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
              <span className="text-[#6e3ff3] font-semibold underline decoration-[#6e3ff3] decoration-2 underline-offset-2">
                {pendingCount} pesanan baru
              </span>{" "}
              yang memerlukan konfirmasi Anda.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-8 sm:h-9 text-xs sm:text-sm font-semibold">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <span>Laporan Data</span>
                <ChevronDown className="size-3 sm:size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setIsImportOpen(true)} className="cursor-pointer">
                <Upload className="size-4 mr-2" />
                Impor CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportCsv("products")} className="cursor-pointer">
                <Download className="size-4 mr-2" />
                Ekspor Produk (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCsv("transactions")} className="cursor-pointer">
                <Download className="size-4 mr-2" />
                Ekspor Transaksi (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsPdfModalOpen(true)} className="cursor-pointer">
                <FileText className="size-4 mr-2 text-indigo-500" />
                Cetak PDF Laporan Penjualan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CSV Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-[420px] p-5">
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Impor Data CSV</DialogTitle>
              <DialogDescription className="text-xs">
                Unggah file CSV baru untuk ditambahkan ke daftar produk desa atau transaksi penjualan.
              </DialogDescription>
            </DialogHeader>

            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-lg border">
              <button
                type="button"
                onClick={() => {
                  setImportType("products");
                  setImportFile(null);
                  setImportError("");
                }}
                className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                  importType === "products" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                }`}
              >
                Data Produk
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportType("transactions");
                  setImportFile(null);
                  setImportError("");
                }}
                className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                  importType === "transactions" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                }`}
              >
                Data Transaksi
              </button>
            </div>

            {/* File Drag and Drop zone */}
            <div className="relative group border-2 border-dashed border-muted hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center bg-muted/5 min-h-[140px]">
              <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors mb-2.5" />
              {importFile ? (
                <div className="space-y-1">
                  <span className="text-xs font-semibold block text-primary truncate max-w-[320px]">
                    {importFile.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">Seret file CSV ke sini</span>
                  <span className="text-[10px] text-muted-foreground block">atau klik untuk memilih file</span>
                </div>
              )}
              <input
                type="file"
                accept=".csv"
                required
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImportFile(file);
                  setImportError("");
                }}
              />
            </div>

            {/* Template Downloader link */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground leading-normal">
                Gunakan format kolom yang tepat agar data terbaca oleh sistem.
              </span>
              <button
                type="button"
                onClick={() => handleDownloadTemplate(importType)}
                className="text-[11px] text-[#6e3ff3] font-bold hover:underline shrink-0 whitespace-nowrap"
              >
                Unduh Template CSV
              </button>
            </div>

            {/* Status alerts */}
            {importError && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 text-xs font-medium">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}
            {importSuccess && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 text-xs font-medium">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{importSuccess}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs font-semibold"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportFile(null);
                  setImportError("");
                }}
                disabled={importLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs font-semibold gap-1.5"
                disabled={importLoading || !importFile}
              >
                {importLoading && <Loader2 className="size-3.5 animate-spin" />}
                Mulai Impor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sales PDF Report Date Range Modal */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-[460px] p-5 border-border/80">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Printer className="size-4 text-indigo-500" />
              Cetak Laporan Penjualan PDF
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Pilih rentang tanggal dan status transaksi untuk diunduh sebagai laporan resmi PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            {/* Quick Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pilihan Rentang Waktu Cepat</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "month", label: "Bulan Ini" },
                  { id: "7days", label: "7 Hari Terakhir" },
                  { id: "30days", label: "30 Hari Terakhir" },
                  { id: "today", label: "Hari Ini" },
                  { id: "all", label: "Semua Waktu" },
                  { id: "custom", label: "Kustom Tanggal" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      datePreset === p.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-indigo-500" /> Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-indigo-500" /> Tanggal Sampai
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Filter className="size-3 text-indigo-500" /> Status Transaksi
              </label>
              <Select value={pdfStatusFilter} onValueChange={setPdfStatusFilter}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status Transaksi</SelectItem>
                  <SelectItem value="Selesai">Hanya Transaksi Selesai (Lunas)</SelectItem>
                  <SelectItem value="Dikirim">Dalam Proses / Dikirim</SelectItem>
                  <SelectItem value="Pending">Hanya Pesanan Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2.5 pt-4 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={pdfLoading}
              onClick={() => setIsPdfModalOpen(false)}
              className="h-8 text-xs font-semibold px-3 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={pdfLoading}
              onClick={handlePrintPdf}
              className="h-8 text-xs font-semibold px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer"
            >
              {pdfLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Printer className="size-3.5" />}
              {pdfLoading ? "Memproses..." : "Cetak Laporan PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
