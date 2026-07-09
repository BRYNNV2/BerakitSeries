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
  ChevronDown,
  Download,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
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

  // Printable Government/Cooperative PDF generator
  const handlePrintPdf = async () => {
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

    // Calculations
    const totalRevenue = transactions
      .filter((t: any) => t.status === "Selesai")
      .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);
    const completedCount = transactions.filter((t: any) => t.status === "Selesai").length;

    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });

    // Create a temporary print container inside the main document body
    const printContainerId = "bumdes-pdf-print-container";
    let printEl = document.getElementById(printContainerId);
    if (printEl) {
      printEl.remove();
    }

    printEl = document.createElement("div");
    printEl.id = printContainerId;

    const htmlContent = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        #bumdes-pdf-print-container {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          padding: 40px;
          background: white !important;
          min-height: 100vh;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 3px double #374151;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .header-logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #6e3ff3, #aa8ef9);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 30px;
          font-weight: bold;
          margin-right: 16px;
        }
        .header-info h1 {
          margin: 0 0 4px 0;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.025em;
        }
        .header-info p {
          margin: 0 0 2px 0;
          font-size: 12px;
          color: #4b5563;
        }
        .report-title {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 24px 0;
          color: #111827;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background-color: #f9fafb;
        }
        .stat-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-top: 4px;
        }
        .table-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #111827;
          border-left: 3px solid #6e3ff3;
          padding-left: 8px;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        table.data-table th {
          background-color: #f3f4f6;
          border-bottom: 2px solid #e5e7eb;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 10px;
          text-transform: uppercase;
        }
        table.data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
        }
        table.data-table tr:last-child td {
          border-bottom: 2px solid #e5e7eb;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 9999px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-selesai { background-color: #d1fae5; color: #065f46; }
        .badge-diproses { background-color: #dbeafe; color: #1e40af; }
        .badge-pending { background-color: #fef3c7; color: #92400e; }
        .badge-dibatalkan { background-color: #fee2e2; color: #991b1b; }
        
        .signature-area {
          margin-top: 50px;
          width: 100%;
          page-break-inside: avoid;
        }
        .signature-box {
          float: right;
          width: 220px;
          text-align: center;
        }
        .signature-line {
          margin-top: 70px;
          border-bottom: 1px solid #4b5563;
          margin-bottom: 4px;
        }
        
        @media print {
          body > *:not(#bumdes-pdf-print-container) {
            display: none !important;
          }
          #bumdes-pdf-print-container {
            display: block !important;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
        @media screen {
          #bumdes-pdf-print-container {
            display: none !important;
          }
        }
      </style>

      <table class="header-table">
        <tr>
          <td style="width: 76px;">
            <div class="header-logo">B</div>
          </td>
          <td class="header-info">
            <h1>${bumdesName}</h1>
            <p>${bumdesAddress}</p>
            <p>Email: ${bumdesEmail} | Telp: ${bumdesPhone}</p>
          </td>
        </tr>
      </table>

      <div class="report-title">Laporan Keuangan & Kinerja Usaha BUMDes</div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Pendapatan Bersih</div>
          <div class="stat-value" style="color: #059669;">${formatter.format(totalRevenue)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Transaksi Berhasil</div>
          <div class="stat-value">${completedCount} Penjualan</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Jenis Produk</div>
          <div class="stat-value">${products.length} Item</div>
        </div>
      </div>

      <div class="table-title">Daftar Transaksi BUMDes</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nama Pelanggan</th>
            <th>Alamat Pengiriman</th>
            <th>Pembayaran</th>
            <th>Status</th>
            <th style="text-align: right;">Total Belanja</th>
          </tr>
        </thead>
        <tbody>
          ${
            transactions.length === 0
              ? '<tr><td colspan="6" style="text-align: center;">Belum ada data transaksi masuk.</td></tr>'
              : transactions
                  .map(
                    (t: any) => `
            <tr>
              <td>${new Date(t.created_at || Date.now()).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}</td>
              <td style="font-weight: 500; color: #111827;">${t.customer_name}</td>
              <td>${t.address || "Desa Berakit"}</td>
              <td style="text-transform: uppercase; font-size: 10px;">${t.payment_method || "COD"}</td>
              <td>
                <span class="badge badge-${(t.status || "Pending").toLowerCase()}">${t.status || "Pending"}</span>
              </td>
              <td style="text-align: right; font-weight: 600; color: #111827;">${formatter.format(t.total_amount || 0)}</td>
            </tr>
          `
                  )
                  .join("")
          }
        </tbody>
      </table>

      <div class="signature-area">
        <div class="signature-box">
          <p>Desa Berakit, ${new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}</p>
          <p style="font-weight: 600; margin-top: 4px;">Kepala BUMDes Berakit</p>
          <div class="signature-line"></div>
          <p style="font-size: 11px; color: #6b7280;">NIP: ${new Date().getFullYear()}-BRKT-01</p>
        </div>
        <div style="clear: both;"></div>
      </div>
    `;

    printEl.innerHTML = htmlContent;
    document.body.appendChild(printEl);

    // Give browser a short tick to parse stylesheets and then trigger printing
    setTimeout(() => {
      window.print();
      
      // Cleanup after print dialog is closed
      setTimeout(() => {
        if (printEl) printEl.remove();
      }, 1000);
    }, 100);
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
              <DropdownMenuItem onClick={handlePrintPdf} className="cursor-pointer">
                <FileText className="size-4 mr-2" />
                Cetak PDF Laporan
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
    </>
  );
}
