"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  CreditCard,
  Truck,
  Database,
  Save,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BumdesSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  enableCod: boolean;
  enableBankTransfer: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  flatShippingRate: number;
  minFreeShipping: number;
}

const DEFAULT_SETTINGS: BumdesSettings = {
  name: "BUMDes Berakit Maju",
  email: "bumdes@berakit.desa.id",
  phone: "081234567890",
  address: "Jl. Pantai Indah RT 02 / RW 01, Desa Berakit, Kec. Teluk Sebong, Kabupaten Bintan, Kepulauan Riau",
  enableCod: true,
  enableBankTransfer: true,
  bankName: "Bank Riau Kepri Syariah",
  accountNumber: "109-20-33458",
  accountHolder: "BUMDES BERAKIT MAJU",
  flatShippingRate: 10000,
  minFreeShipping: 150000,
};

export function SettingsPanel() {
  const [activeSubTab, setActiveSubTab] = React.useState<"profile" | "payment" | "shipping" | "database">("profile");
  const [settings, setSettings] = React.useState<BumdesSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Database tools state
  const [dbLoading, setDbLoading] = React.useState(false);
  const [dbMessage, setDbMessage] = React.useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);

  React.useEffect(() => {
    setIsUsingSupabase(!!supabase);
    // Load settings from localStorage if exist
    const local = localStorage.getItem("berakit_settings");
    if (local) {
      setSettings(JSON.parse(local));
    } else {
      localStorage.setItem("berakit_settings", JSON.stringify(DEFAULT_SETTINGS));
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    // Save to localStorage
    localStorage.setItem("berakit_settings", JSON.stringify(settings));

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 600));

    setSaveSuccess(true);
    setLoading(false);

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Database utilities: Seed data
  const handleSeedDatabase = async () => {
    setDbLoading(true);
    setDbMessage({ text: "", type: "" });

    // Seed targets
    const defaultProducts = [
      {
        name: "Madu Hutan Asli Berakit",
        description: "Madu murni yang diambil langsung dari hutan di sekitar Desa Berakit. Kualitas terjamin tanpa bahan pengawet.",
        price: 85000,
        stock: 24,
        image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60",
        category: "Kuliner",
      },
      {
        name: "Keripik Gonggong Pedas Manis",
        description: "Keripik khas Kepulauan Riau yang terbuat dari siput gonggong segar dengan bumbu pedas manis karamel.",
        price: 35000,
        stock: 80,
        image_url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop&q=60",
        category: "Kuliner",
      },
      {
        name: "Kerajinan Miniatur Kapal Kayu",
        description: "Miniatur kapal tradisional Melayu yang dirakit dengan tangan oleh pengrajin lokal Desa Berakit menggunakan kayu keras pilihan.",
        price: 250000,
        stock: 5,
        image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60",
        category: "Kerajinan",
      },
      {
        name: "Ikan Asin Tenggiri Kering",
        description: "Ikan tenggiri segar tangkapan nelayan Berakit yang diasinkan secara tradisional dan dikeringkan di bawah sinar matahari.",
        price: 65000,
        stock: 12,
        image_url: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=500&auto=format&fit=crop&q=60",
        category: "Hasil Laut",
      },
    ];

    const defaultTransactions = [
      {
        customer_name: "Budi Santoso",
        customer_phone: "081234567890",
        address: "Jl. Raya Berakit No. 12, Desa Berakit",
        total_amount: 170000,
        status: "Selesai",
        payment_method: "Transfer Bank",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        customer_name: "Siti Rahma",
        customer_phone: "089876543210",
        address: "RT 02 / RW 01, Dusun 2 Desa Berakit",
        total_amount: 35000,
        status: "Pending",
        payment_method: "COD",
        created_at: new Date().toISOString(),
      },
      {
        customer_name: "Andi Wijaya",
        customer_phone: "085299887766",
        address: "Penginapan Berakit Indah, RT 01",
        total_amount: 250000,
        status: "Diproses",
        payment_method: "Transfer Bank",
        created_at: new Date().toISOString(),
      },
      {
        customer_name: "Rina Kartika",
        customer_phone: "087711223344",
        address: "Kavling Nelayan, Desa Berakit",
        total_amount: 65000,
        status: "Dibatalkan",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: "COD",
      },
    ];

    if (isUsingSupabase && supabase) {
      try {
        // Attempt seeding Supabase
        const { error: prodError } = await supabase.from("products").insert(defaultProducts);
        const { error: txError } = await supabase.from("orders").insert(defaultTransactions);

        if (prodError || txError) {
          throw new Error(
            `Gagal seeding Supabase. RLS Kebijakan mungkin memblokir input publik. Detail: ${
              prodError?.message || txError?.message
            }`
          );
        }

        setDbMessage({
          text: "Berhasil mengunggah 4 produk dan 4 transaksi contoh ke Supabase Cloud!",
          type: "success",
        });
      } catch (err: any) {
        console.error(err);
        setDbMessage({
          text: err.message || "Gagal melakukan seeding. Coba disable RLS di dashboard Supabase Anda.",
          type: "error",
        });
      }
    } else {
      // Local fallback
      localStorage.setItem("berakit_products", JSON.stringify(defaultProducts));
      localStorage.setItem("berakit_transactions", JSON.stringify(defaultTransactions));
      setDbMessage({
        text: "Berhasil merestore data contoh BUMDes Berakit ke LocalStorage!",
        type: "success",
      });
    }
    setDbLoading(false);
  };

  // Database utilities: Clear data
  const handleClearDatabase = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA data produk dan pesanan? Tindakan ini permanen.")) return;

    setDbLoading(true);
    setDbMessage({ text: "", type: "" });

    if (isUsingSupabase && supabase) {
      try {
        const { error: txError } = await supabase.from("orders").delete().neq("id", "0");
        const { error: prodError } = await supabase.from("products").delete().neq("id", "0");

        if (prodError || txError) {
          throw new Error(
            `Gagal membersihkan data Supabase. RLS Kebijakan mungkin memblokir penghapusan. Detail: ${
              prodError?.message || txError?.message
            }`
          );
        }

        setDbMessage({ text: "Seluruh data produk & pesanan di Supabase berhasil dihapus bersih!", type: "success" });
      } catch (err: any) {
        console.error(err);
        setDbMessage({
          text: err.message || "Gagal menghapus data. Periksa konfigurasi RLS Anda.",
          type: "error",
        });
      }
    } else {
      localStorage.removeItem("berakit_products");
      localStorage.removeItem("berakit_transactions");
      setDbMessage({ text: "Seluruh data di LocalStorage berhasil dihapus bersih!", type: "success" });
    }
    setDbLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Settings layout split */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation sidebar */}
        <div className="w-full md:w-[220px] lg:w-[240px] shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 md:border-r pr-0 md:pr-4">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeSubTab === "profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Building2 className="size-4" />
            Profil BUMDes
          </button>
          <button
            onClick={() => setActiveSubTab("payment")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeSubTab === "payment"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <CreditCard className="size-4" />
            Pembayaran & COD
          </button>
          <button
            onClick={() => setActiveSubTab("shipping")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeSubTab === "shipping"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Truck className="size-4" />
            Tarif Ongkos Kirim
          </button>
          <button
            onClick={() => setActiveSubTab("database")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeSubTab === "database"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Database className="size-4" />
            Pemeliharaan Data
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-xl border bg-card p-4 sm:p-6 shadow-xs min-w-0">
          <form onSubmit={handleSave} className="space-y-6">
            {/* SUBTAB 1: BUMDes Profile */}
            {activeSubTab === "profile" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Profil Pengelola BUMDes</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Informasi identitas koperasi desa yang akan tampil di halaman checkout pembeli.
                  </p>
                </div>
                <div className="grid gap-4 pt-2">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">Nama Instansi / BUMDes *</label>
                    <Input
                      required
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">Email Kontak</label>
                      <Input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">No. Telepon / WhatsApp *</label>
                      <Input
                        required
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">Alamat Kantor Pusat BUMDes</label>
                    <textarea
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: Payment and Bank Transfers */}
            {activeSubTab === "payment" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold">Metode Pembayaran Jualan</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Atur opsi pembayaran yang disediakan untuk pelanggan Anda.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* COD Option */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-sm font-semibold block">Bayar di Tempat (COD)</span>
                      <span className="text-xs text-muted-foreground block">
                        Pelanggan melakukan pembayaran tunai saat kurir desa mengantarkan produk.
                      </span>
                    </div>
                    <Switch
                      checked={settings.enableCod}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableCod: checked })}
                    />
                  </div>

                  {/* Bank Transfer Option */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-sm font-semibold block">Transfer Bank Manual</span>
                      <span className="text-xs text-muted-foreground block">
                        Pelanggan mentransfer total belanja ke rekening resmi BUMDes dan mengunggah bukti transfer.
                      </span>
                    </div>
                    <Switch
                      checked={settings.enableBankTransfer}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableBankTransfer: checked })}
                    />
                  </div>

                  {/* Bank Transfer Credentials */}
                  {settings.enableBankTransfer && (
                    <div className="rounded-lg border p-4 space-y-4 bg-muted/5 animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-[#6e3ff3] block uppercase tracking-wider">Detail Rekening Bank</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold">Nama Bank *</label>
                          <Input
                            required={settings.enableBankTransfer}
                            placeholder="Misal: Bank Riau Kepri"
                            value={settings.bankName}
                            onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold">Nomor Rekening *</label>
                          <Input
                            required={settings.enableBankTransfer}
                            placeholder="Nomor rekening"
                            value={settings.accountNumber}
                            onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold">Nama Pemilik Rekening *</label>
                        <Input
                          required={settings.enableBankTransfer}
                          placeholder="Nama pemilik rekening"
                          value={settings.accountHolder}
                          onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 3: Shipping Fees */}
            {activeSubTab === "shipping" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Konfigurasi Pengiriman Desa</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tentukan tarif antar barang jualan BUMDes ke pembeli.
                  </p>
                </div>
                <div className="grid gap-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">Tarif Flat Kirim Desa (Rp) *</label>
                      <Input
                        required
                        type="number"
                        min="0"
                        value={settings.flatShippingRate}
                        onChange={(e) => setSettings({ ...settings, flatShippingRate: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">Min. Belanja Gratis Ongkir (Rp)</label>
                      <Input
                        type="number"
                        min="0"
                        value={settings.minFreeShipping}
                        onChange={(e) => setSettings({ ...settings, minFreeShipping: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-lg border border-[#35b9e9]/20 bg-[#35b9e9]/5 text-xs text-[#35b9e9] font-medium leading-relaxed">
                    Pengiriman antar produk di Desa Berakit dikelola secara mandiri oleh kurir khusus BUMDes demi efisiensi biaya ongkir bagi warga lokal.
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: Database Maintenance Tools */}
            {activeSubTab === "database" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Alat Pemeliharaan Database</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kelola dan perbarui data contoh untuk keperluan presentasi atau migrasi.
                  </p>
                </div>

                <div className="pt-2 space-y-4">
                  {/* Supabase status banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold block">Tipe Database Terdeteksi</span>
                      <span className="text-sm font-bold text-[#6e3ff3]">
                        {isUsingSupabase ? "Supabase Cloud API" : "LocalStorage (Simulasi Web)"}
                      </span>
                    </div>
                    <Badge variant={isUsingSupabase ? "default" : "secondary"}>
                      {isUsingSupabase ? "Live Cloud" : "Offline Sandbox"}
                    </Badge>
                  </div>

                  {/* Seed and Clean actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-lg border p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold block">Seed Data Awal</span>
                        <span className="text-xs text-muted-foreground block">
                          Masukkan 4 produk Melayu asli Berakit dan 4 transaksi penjualan contoh ke database Anda.
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSeedDatabase}
                        disabled={dbLoading}
                        className="w-full h-9 text-xs sm:text-sm font-semibold gap-1.5"
                      >
                        {dbLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                        Masukkan Data Contoh
                      </Button>
                    </div>

                    <div className="rounded-lg border border-rose-100 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-rose-500 block">Kosongkan Database</span>
                        <span className="text-xs text-muted-foreground block">
                          Hapus bersih semua data produk dan data transaksi dari database saat ini.
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleClearDatabase}
                        disabled={dbLoading}
                        className="w-full h-9 text-xs sm:text-sm font-semibold gap-1.5"
                      >
                        {dbLoading ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                        Kosongkan Seluruh Data
                      </Button>
                    </div>
                  </div>

                  {/* Log/status messages */}
                  {dbMessage.text && (
                    <div
                      className={`p-3 rounded-lg border text-xs sm:text-sm font-medium animate-in fade-in duration-200 ${
                        dbMessage.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-rose-200 bg-rose-50 text-rose-600"
                      }`}
                    >
                      {dbMessage.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Buttons Footer (visible on all tabs except database) */}
            {activeSubTab !== "database" && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button type="submit" disabled={loading} className="gap-2 h-9 sm:h-10 text-xs sm:text-sm">
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="size-4 text-white" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {loading ? "Menyimpan..." : saveSuccess ? "Tersimpan!" : "Simpan Pengaturan"}
                </Button>

                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-500 animate-in fade-in duration-200">
                    Konfigurasi berhasil disimpan!
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
