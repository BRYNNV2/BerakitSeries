"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  UserCircle,
  Camera,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDashboardStore } from "@/store/dashboard-store";
import { addActivityLog } from "@/lib/logger";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  name: "BERAKIT SERIES",
  email: "mfyansah@student.umrah.ac.id",
  phone: "081234567890",
  address: "Jalan Bhatin Muhammad Ali, Gang Asiah No. 20, RT 06 / RW 03, Semelur Desa Berakit Kecamatan Teluk Sebong Kabupaten Bintan, Kepulauan Riau",
  enableCod: true,
  enableBankTransfer: true,
  bankName: "Bank Riau Kepri Syariah",
  accountNumber: "109-20-33458",
  accountHolder: "BERAKIT SERIES HQ",
  flatShippingRate: 10000,
  minFreeShipping: 150000,
};

const AVATAR_TEMPLATES = [
  "https://api.dicebear.com/9.x/glass/svg?seed=Berakit",
  "https://api.dicebear.com/9.x/glass/svg?seed=Admin",
  "https://api.dicebear.com/9.x/glass/svg?seed=Melayu",
  "https://api.dicebear.com/9.x/glass/svg?seed=Kepri",
  "https://api.dicebear.com/9.x/glass/svg?seed=BUMDes",
];

export function SettingsPanel() {
  const [activeSubTab, setActiveSubTab] = React.useState<"admin-profile" | "profile" | "payment" | "shipping" | "database">("admin-profile");
  const [settings, setSettings] = React.useState<BumdesSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [isWipeDialogOpen, setIsWipeDialogOpen] = React.useState(false);

  // Zustand Admin Profile bindings
  const adminName = useDashboardStore((state) => state.adminName);
  const adminEmail = useDashboardStore((state) => state.adminEmail);
  const adminAvatar = useDashboardStore((state) => state.adminAvatar);
  const setAdminProfile = useDashboardStore((state) => state.setAdminProfile);

  // Admin Profile edit states
  const [profileName, setProfileName] = React.useState("");
  const [profileEmail, setProfileEmail] = React.useState("");
  const [profileAvatar, setProfileAvatar] = React.useState("");

  // Database tools state
  const [dbLoading, setDbLoading] = React.useState(false);
  const [dbMessage, setDbMessage] = React.useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);

  // Sync edit state with store changes
  React.useEffect(() => {
    setProfileName(adminName);
    setProfileEmail(adminEmail);
    setProfileAvatar(adminAvatar);
  }, [adminName, adminEmail, adminAvatar]);

  React.useEffect(() => {
    setIsUsingSupabase(!!supabase);
    // Load BUMDes settings from localStorage if exist
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

    if (activeSubTab === "admin-profile") {
      // Save Admin Profile to Zustand store and localStorage
      const updatedProfile = {
        name: profileName,
        email: profileEmail,
        avatar: profileAvatar,
      };
      setAdminProfile(updatedProfile);
      localStorage.setItem("berakit_admin_profile", JSON.stringify(updatedProfile));
      addActivityLog(
        "Update Profil Admin",
        `Mengubah nama profil admin menjadi '${profileName}' dan email menjadi '${profileEmail}'`,
        "settings"
      );

      // Persist to Supabase database (Auth User Metadata) if active
      if (isUsingSupabase && supabase) {
        try {
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              full_name: profileName,
              avatar_url: profileAvatar,
            },
          });
          if (authError) {
            console.error("Failed to update user profile in Supabase:", authError.message);
          }
        } catch (err) {
          console.error("Error updating profile in Supabase:", err);
        }
      }
    } else {
      // Save BUMDes cooperative configurations
      localStorage.setItem("berakit_settings", JSON.stringify(settings));
      
      let typeLabel = "Umum";
      if (activeSubTab === "payment") typeLabel = "Metode Pembayaran";
      else if (activeSubTab === "shipping") typeLabel = "Metode Pengiriman";

      addActivityLog(
        "Update Konfigurasi",
        `Memperbarui setelan BUMDes pada bagian '${typeLabel}'`,
        "settings"
      );
    }

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    setSaveSuccess(true);
    setLoading(false);
    toast.success("Pengaturan BUMDes berhasil disimpan!");

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfileAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Database utilities: Seed data
  const handleSeedDatabase = async () => {
    setDbLoading(true);
    setDbMessage({ text: "", type: "" });

    const defaultProducts = [
      {
        name: "Batik Tulis Biota Laut",
        description: "Batik tulis eksklusif dengan motif terumbu karang dan gonggong khas pesisir Berakit. Dibuat menggunakan pewarna alam premium.",
        price: 450000,
        stock: 24,
        image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60",
        category: "Batik Tulis",
      },
      {
        name: "Batik Cap Mangrove Berakit",
        description: "Batik cap motif daun mangrove dengan desain geometris modern, sangat cocok untuk pakaian formal dan semi-formal.",
        price: 195000,
        stock: 80,
        image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500&auto=format&fit=crop&q=60",
        category: "Batik Cap",
      },
      {
        name: "Batik Kombinasi Semelur",
        description: "Perpaduan elegan teknik cap dan canting tulis dengan corak ombak samudra biru tua yang menawan.",
        price: 295000,
        stock: 5,
        image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60",
        category: "Batik Kombinasi",
      },
      {
        name: "Selendang Sutra Batik Berakit",
        description: "Selendang sutra premium bermotif batik tulis pesisir yang halus, memberikan sentuhan mewah pada penampilan Anda.",
        price: 150000,
        stock: 12,
        image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
        category: "Aksesoris",
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
      localStorage.setItem("berakit_products", JSON.stringify(defaultProducts));
      localStorage.setItem("berakit_transactions", JSON.stringify(defaultTransactions));
      setDbMessage({
        text: "Berhasil merestore data contoh BUMDes Berakit ke LocalStorage!",
        type: "success",
      });
    }
    setDbLoading(false);
  };

  const handleClearDatabase = async () => {
    setIsWipeDialogOpen(false);
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

        addActivityLog("Kosongkan Database", "Membersihkan seluruh data produk dan pesanan di Supabase", "system");
        setDbMessage({ text: "Seluruh data produk & pesanan di Supabase berhasil dihapus bersih!", type: "success" });
        toast.success("Database Supabase berhasil dibersihkan.");
      } catch (err: any) {
        console.error(err);
        setDbMessage({
          text: err.message || "Gagal menghapus data. Periksa konfigurasi RLS Anda.",
          type: "error",
        });
        toast.error("Gagal membersihkan database Supabase.");
      }
    } else {
      localStorage.removeItem("berakit_products");
      localStorage.removeItem("berakit_transactions");
      addActivityLog("Kosongkan Database", "Membersihkan seluruh data produk dan pesanan di LocalStorage", "system");
      setDbMessage({ text: "Seluruh data di LocalStorage berhasil dihapus bersih!", type: "success" });
      toast.success("Penyimpanan lokal berhasil dibersihkan.");
    }
    setDbLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation sidebar */}
        <div className="w-full md:w-[220px] lg:w-[240px] shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 md:border-r pr-0 md:pr-4">
          <button
            type="button"
            onClick={() => setActiveSubTab("admin-profile")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeSubTab === "admin-profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <UserCircle className="size-4" />
            Profil Admin
          </button>
          <button
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
            
            {/* SUBTAB 0: Admin Profile (NEW) */}
            {activeSubTab === "admin-profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold">Pengaturan Akun Pengguna</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kelola foto profil, nama pengguna, dan informasi detail akun login Anda.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Photo Profile Uploader */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border bg-muted/10">
                    <div className="relative group shrink-0">
                      <Avatar className="size-20 sm:size-24 border-2 border-primary/20 shadow-md">
                        <AvatarImage src={profileAvatar} />
                        <AvatarFallback className="text-xl font-bold">
                          {profileName.slice(0, 2).toUpperCase() || "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="size-5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    <div className="space-y-3 flex-1 text-center sm:text-left min-w-0">
                      <span className="text-sm font-semibold block">Foto Profil Admin</span>
                      <span className="text-xs text-muted-foreground block leading-normal">
                        Unggah foto kustom Anda (Maksimal 1MB) atau pilih dari template unik bertema Kepulauan Riau di bawah.
                      </span>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-semibold relative"
                          asChild
                        >
                          <label className="cursor-pointer">
                            <Upload className="size-3.5" />
                            Unggah Foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-rose-500 font-semibold hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setProfileAvatar("https://api.dicebear.com/9.x/glass/svg?seed=Berakit")}
                        >
                          Reset Default
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Pre-made Templates */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Template Avatar Kreatif</span>
                    <div className="flex flex-wrap gap-3">
                      {AVATAR_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileAvatar(tmpl)}
                          className={`relative rounded-xl overflow-hidden border-2 p-0.5 hover:scale-105 active:scale-95 transition-all ${
                            profileAvatar === tmpl ? "border-[#6e3ff3] shadow-md shadow-[#6e3ff3]/10" : "border-transparent"
                          }`}
                        >
                          <Avatar className="size-11 sm:size-12">
                            <AvatarImage src={tmpl} />
                            <AvatarFallback>T{idx}</AvatarFallback>
                          </Avatar>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profile inputs */}
                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">Nama Lengkap *</label>
                      <Input
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Nama Lengkap Admin"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Email Pengguna</label>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted px-1.5 py-0">
                          Deteksi Otomatis Akun
                        </Badge>
                      </div>
                      <Input
                        disabled
                        value={profileEmail}
                        placeholder="admin@berakit.desa.id"
                        className="bg-muted/40 cursor-not-allowed text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                        onClick={() => setIsWipeDialogOpen(true)}
                        disabled={dbLoading}
                        className="w-full h-9 text-xs sm:text-sm font-semibold gap-1.5"
                      >
                        {dbLoading ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                        Kosongkan Seluruh Data
                      </Button>
                    </div>
                  </div>

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

      {/* Wipe Confirmation Dialog */}
      <Dialog open={isWipeDialogOpen} onOpenChange={setIsWipeDialogOpen}>
        <DialogContent className="max-w-[400px] border-border/80">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-4 w-4" />
              Kosongkan Database BUMDes
            </DialogTitle>
            <DialogDescription className="text-xs mt-2 text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus SEMUA data produk dan data pesanan? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWipeDialogOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearDatabase}
              className="text-xs"
            >
              Ya, Kosongkan Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
