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
  const [activeSubTab, setActiveSubTab] = React.useState<"admin-profile" | "profile" | "payment" | "shipping" | "users">("admin-profile");
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
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(!!supabase);

  // User Management states
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = React.useState(false);

  const loadProfiles = React.useCallback(async () => {
    if (!supabase) return;
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.warn("Failed to load profiles:", err);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeSubTab === "users") {
      loadProfiles();
    }
  }, [activeSubTab, loadProfiles]);

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    if (!supabase) return;
    const newRole = currentRole === "admin" ? "buyer" : "admin";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);
      
      if (error) throw error;
      
      toast.success(`Berhasil mengubah role pengguna menjadi ${newRole}!`);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      addActivityLog(
        "Update Role User",
        `Mengubah hak akses user ID ${userId} menjadi '${newRole}'`,
        "settings"
      );
    } catch (err: any) {
      console.error("Gagal mengubah role:", err);
      toast.error(`Gagal mengubah role: ${err.message || err}`);
    }
  };

  // Sync edit state with store changes
  const [uploading, setUploading] = React.useState(false);

  // Sync edit state with store changes
  React.useEffect(() => {
    setProfileName(adminName);
    setProfileEmail(adminEmail);
    setProfileAvatar(adminAvatar);
  }, [adminName, adminEmail, adminAvatar]);

  // Load settings and profile from Supabase on mount
  const loadSupabaseSettings = React.useCallback(async () => {
    if (!supabase) return;
    try {
      // Get the logged in user's email from auth
      const { data: userData } = await supabase.auth.getUser();
      const currentLoggedInEmail = userData?.user?.email || adminEmail;

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "bumdes_config")
        .single();
      
      if (error) {
        console.warn("Could not load settings from Supabase, table might not be created yet:", error.message);
        return;
      }

      if (data) {
        const loadedSettings: BumdesSettings = {
          name: data.name || DEFAULT_SETTINGS.name,
          email: data.email || DEFAULT_SETTINGS.email,
          phone: data.phone || DEFAULT_SETTINGS.phone,
          address: data.address || DEFAULT_SETTINGS.address,
          enableCod: data.enable_cod ?? DEFAULT_SETTINGS.enableCod,
          enableBankTransfer: data.enable_bank_transfer ?? DEFAULT_SETTINGS.enableBankTransfer,
          bankName: data.bank_name || DEFAULT_SETTINGS.bankName,
          accountNumber: data.account_number || DEFAULT_SETTINGS.accountNumber,
          accountHolder: data.account_holder || DEFAULT_SETTINGS.accountHolder,
          flatShippingRate: Number(data.flat_shipping_rate) ?? DEFAULT_SETTINGS.flatShippingRate,
          minFreeShipping: Number(data.min_free_shipping) ?? DEFAULT_SETTINGS.minFreeShipping,
        };
        setSettings(loadedSettings);
        localStorage.setItem("berakit_settings", JSON.stringify(loadedSettings));

        // Read local profile first to prevent overwriting custom uploaded avatar with default values
        const localProfileStr = typeof window !== "undefined" ? localStorage.getItem("berakit_admin_profile") : null;
        let localProfile: { name?: string; email?: string; avatar?: string } | null = null;
        if (localProfileStr) {
          try {
            localProfile = JSON.parse(localProfileStr);
          } catch (e) {}
        }

        const loadedProfile = {
          name: data.admin_name || userData?.user?.user_metadata?.full_name || localProfile?.name || adminName,
          email: currentLoggedInEmail || data.admin_email || localProfile?.email || adminEmail,
          avatar: data.admin_avatar || userData?.user?.user_metadata?.avatar_url || localProfile?.avatar || adminAvatar,
        };
        setAdminProfile(loadedProfile);
        localStorage.setItem("berakit_admin_profile", JSON.stringify(loadedProfile));

        setProfileName(loadedProfile.name);
        setProfileEmail(loadedProfile.email);
        setProfileAvatar(loadedProfile.avatar);
      }
    } catch (err) {
      console.warn("Error loading settings from Supabase:", err);
    }
  }, [adminName, adminEmail, adminAvatar, setAdminProfile]);

  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    setIsUsingSupabase(!!supabase);
    
    // Load local storage first
    const local = localStorage.getItem("berakit_settings");
    if (local) {
      setSettings(JSON.parse(local));
    } else {
      localStorage.setItem("berakit_settings", JSON.stringify(DEFAULT_SETTINGS));
    }

    // Try loading from Supabase
    loadSupabaseSettings();
  }, [loadSupabaseSettings]);

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

    // Persist all settings and profile details to Supabase settings table
    if (isUsingSupabase && supabase) {
      try {
        // Also update the logged-in user metadata in Supabase Auth so it is permanently saved in Auth db
        await supabase.auth.updateUser({
          data: {
            full_name: profileName,
            avatar_url: profileAvatar,
          }
        });

        const upsertPayload: any = {
          id: "bumdes_config",
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          enable_cod: settings.enableCod,
          enable_bank_transfer: settings.enableBankTransfer,
          bank_name: settings.bankName,
          account_number: settings.accountNumber,
          account_holder: settings.accountHolder,
          flat_shipping_rate: settings.flatShippingRate,
          min_free_shipping: settings.minFreeShipping,
          admin_name: profileName,
          admin_email: profileEmail,
          admin_avatar: profileAvatar,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("settings")
          .upsert(upsertPayload);

        if (error) {
          console.warn("Failed to persist settings in Supabase:", error.message);
        }
      } catch (err) {
        console.warn("Error persisting settings in Supabase:", err);
      }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file tidak boleh melebihi 2MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload directly to the existing public "gallery" bucket
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(filePath);

      setProfileAvatar(publicUrl);

      // Immediately sync with Zustand & localStorage
      const updatedProfile = {
        name: profileName || adminName,
        email: profileEmail || adminEmail,
        avatar: publicUrl,
      };
      setAdminProfile(updatedProfile);
      localStorage.setItem("berakit_admin_profile", JSON.stringify(updatedProfile));

      toast.success("Foto profil berhasil diunggah ke Supabase Storage!");
    } catch (err: any) {
      console.error("Gagal mengunggah foto profil:", err);
      toast.error("Gagal mengunggah foto: " + (err.message || err));
    } finally {
      setUploading(false);
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

  const hasEnvCredentials = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "" && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your_supabase_anon_key_here";

  const handleToggleDbMode = () => {
    const nextMode = !isUsingSupabase;
    if (nextMode) {
      localStorage.removeItem("berakit_force_local_db");
      toast.success("Beralih ke Database Supabase Cloud.");
    } else {
      localStorage.setItem("berakit_force_local_db", "true");
      toast.success("Beralih ke Penyimpanan Lokal (LocalStorage).");
    }
    setTimeout(() => {
      window.location.reload();
    }, 800);
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
            Profil & BUMDes
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
            onClick={() => setActiveSubTab("users")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeSubTab === "users"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <UserCircle className="size-4" />
            Manajemen User
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-xl border bg-card p-4 sm:p-6 shadow-xs min-w-0">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* SUBTAB 0: Admin Profile & BUMDes Profile */}
            {activeSubTab === "admin-profile" && (
              <div className="space-y-6">
                
                {/* Section 1: Admin Personal Account */}
                <div className="border-b pb-4">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                    Profil Pengguna (Akun Admin)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-8">
                    Mengatur data personal Anda sebagai pengelola sistem (nama lengkap & foto profil). Data ini bersifat internal untuk akun login Anda.
                  </p>
                </div>

                <div className="space-y-6 pt-2 pl-8">
                  {/* Photo Profile Uploader */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border bg-muted/10">
                    <div className="relative group shrink-0">
                      <Avatar className="size-20 sm:size-24 border-2 border-primary/20 shadow-md notranslate" translate="no">
                        <AvatarImage src={profileAvatar} />
                        <AvatarFallback className="text-xl font-bold">
                          <span>{profileName.slice(0, 2).toUpperCase() || "AD"}</span>
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
                        Unggah foto kustom Anda (Maksimal 1MB) atau pilih dari template avatar di bawah.
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
                          <Avatar className="size-11 sm:size-12 notranslate" translate="no">
                            <AvatarImage src={tmpl} />
                            <AvatarFallback><span>T{idx}</span></AvatarFallback>
                          </Avatar>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profile inputs */}
                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">Nama Lengkap Admin *</label>
                      <Input
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Nama Lengkap Admin"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Email Pengguna (Untuk Login)</label>
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

                {/* Separator / Divider */}
                <div className="border-t my-8 pt-8"></div>

                {/* Section 2: BUMDes Store Identity */}
                <div className="border-b pb-4">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                    Identitas Toko & Kantor BUMDes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-8">
                    Mengatur data resmi toko/koperasi desa BUMDes Berakit. Informasi ini **akan ditampilkan kepada pembeli** pada halaman checkout, detail produk, serta nota/invoice pembelian.
                  </p>
                </div>

                <div className="grid gap-4 pt-2 pl-8">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">Nama Instansi / Toko BUMDes *</label>
                    <Input
                      required
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      placeholder="Nama Instansi/Toko BUMDes"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">Email Kontak Toko (Ditampilkan ke Pembeli)</label>
                      <Input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        placeholder="email@berakit.desa.id"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold">No. Telepon / WhatsApp Toko *</label>
                      <Input
                        required
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        placeholder="Contoh: 0812345678"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold">Alamat Kantor Pusat BUMDes (Asal Pengiriman Nota)</label>
                    <textarea
                      className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="Alamat kantor atau lokasi koperasi pengirim..."
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

            {/* SUBTAB 4: User Management (Manajemen User) */}
            {activeSubTab === "users" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-base font-semibold">Manajemen Hak Akses Pengguna</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kelola hak akses pengguna terdaftar di sistem BUMDes Berakit. Anda dapat mengubah pembeli biasa menjadi admin.
                  </p>
                </div>

                {profilesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Memuat data pengguna...</span>
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="border border-dashed rounded-xl p-10 text-center text-muted-foreground">
                    <UserCircle className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                    <span className="text-xs font-semibold">Tidak ada pengguna kustom terdaftar.</span>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="p-3.5">Nama & Kontak</th>
                            <th className="p-3.5">Email</th>
                            <th className="p-3.5">Role</th>
                            <th className="p-3.5">Tanggal Daftar</th>
                            <th className="p-3.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profiles.map((p) => {
                            const isSelfOrMasterAdmin = p.email === "admin@berakit.desa.id" || p.email === adminEmail;
                            return (
                              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/10 text-xs font-medium">
                                <td className="p-3.5">
                                  <div className="font-semibold text-foreground">{p.full_name || "Pelanggan Tanpa Nama"}</div>
                                  <div className="text-[10px] text-muted-foreground">{p.phone || "-"}</div>
                                </td>
                                <td className="p-3.5 font-mono text-[11px]">{p.email}</td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                    p.role === "admin" 
                                      ? "bg-rose-50 text-rose-700 border-rose-100" 
                                      : "bg-zinc-100 text-zinc-650 border-zinc-200"
                                  }`}>
                                    {p.role}
                                  </span>
                                </td>
                                <td className="p-3.5 text-muted-foreground text-[10px]">
                                  {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td className="p-3.5 text-right">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={p.role === "admin" ? "outline" : "default"}
                                    disabled={isSelfOrMasterAdmin}
                                    onClick={() => handleUpdateRole(p.id, p.role)}
                                    className={`h-7 text-[9px] px-3 font-bold uppercase tracking-wider rounded-md cursor-pointer ${
                                      p.role === "admin" ? "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200" : ""
                                    }`}
                                  >
                                    {p.role === "admin" ? "Jadikan Buyer" : "Jadikan Admin"}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Buttons Footer */}
            {activeSubTab !== "users" && (
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
