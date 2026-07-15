"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  LogOut,
  UploadCloud,
  ChevronRight,
  ChevronsUpDown,
  Store,
  Calendar,
  Phone,
  Check,
  Loader2,
  ExternalLink,
  LayoutGrid,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>({
    full_name: "",
    phone: "",
    address: "",
  });
  const [orders, setOrders] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<"overview" | "orders" | "profile">("overview");

  // Profile Edit State
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [fullNameInput, setFullNameInput] = React.useState("");
  const [phoneInput, setPhoneInput] = React.useState("");
  const [addressInput, setAddressInput] = React.useState("");

  // Receipt Upload State
  const [uploadingReceiptOrderId, setUploadingReceiptOrderId] = React.useState<string | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    const initDashboard = async () => {
      if (!supabase) {
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }

        const currentUser = session.user;
        let userRole = currentUser?.role;
        if (currentUser && !userRole) {
          try {
            const { data: pData } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", currentUser.id)
              .single();
            if (pData?.role) userRole = pData.role;
          } catch (e) {
            console.warn("Failed fetching profile role in user dashboard check:", e);
          }
        }

        if (userRole === "admin" || currentUser.email === "admin@berakit.desa.id") {
          router.push("/admin");
          return;
        }
        setUser(currentUser);

        // Fetch User Profile
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (!profileErr && profileData) {
          setProfile(profileData);
          setFullNameInput(profileData.full_name || "");
          setPhoneInput(profileData.phone || "");
          setAddressInput(profileData.address || "");
        } else {
          // If no profile row exists yet, initialize inputs with email
          setFullNameInput(currentUser.email?.split("@")[0] || "");
        }

        // Fetch User Orders
        const { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (!ordersErr && ordersData) {
          setOrders(ordersData);
        }
      } catch (err) {
        console.error("Gagal menginisialisasi dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const updatedProfile = {
        id: user.id,
        email: user.email,
        full_name: fullNameInput,
        phone: phoneInput,
        address: addressInput,
      };

      // Check if profile exists by selecting it first
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      let error = null;

      if (existingProfile) {
        // Update
        const { error: updateErr } = await supabase
          .from("profiles")
          .update(updatedProfile)
          .eq("id", user.id);
        error = updateErr;
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from("profiles")
          .insert([updatedProfile]);
        error = insertErr;
      }

      if (error) throw error;

      setProfile(updatedProfile);
      toast.success("Profil Anda berhasil diperbarui!");
    } catch (err: any) {
      console.error("Gagal menyimpan profil:", err);
      toast.error(`Gagal menyimpan profil: ${err.message || err}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleReceiptUpload = async (orderId: string) => {
    if (!receiptFile || !user) {
      toast.error("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload receipt to storage
      const fileExt = receiptFile.name.split(".").pop();
      const fileName = `${orderId}_receipt_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receiptFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      // 3. Update Order in DB
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          receipt_url: publicUrl,
          status: "Pending" // Reset status to Pending to trigger admin review
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 4. Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, receipt_url: publicUrl, status: "Pending" } : o));
      
      toast.success("Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.");
      setUploadingReceiptOrderId(null);
      setReceiptFile(null);
    } catch (err: any) {
      console.error("Gagal mengunggah bukti pembayaran:", err);
      toast.error(`Gagal mengunggah bukti pembayaran: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      localStorage.removeItem("berakit_admin_auth");
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <Loader2 className="size-10 animate-spin text-zinc-900" />
        <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">Memuat Dashboard...</span>
      </div>
    );
  }

  // Derived stats
  const totalSpent = orders
    .filter(o => o.status === "Selesai")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Diproses" || o.status === "Dikirim");

  const displayName = profile.full_name || user?.email?.split("@")[0] || "Pelanggan";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  const buyerMenuItems = [
    { id: "overview" as const, title: "Ringkasan Akun", icon: LayoutGrid },
    { id: "orders" as const, title: "Pesanan Saya", icon: ShoppingBag, count: orders.length },
    { id: "profile" as const, title: "Ubah Profil", icon: User },
  ];

  return (
    <SidebarProvider className="bg-sidebar">
      
      {/* ─── SIDEBAR NAVIGATION (PORTAL BUYER) ─── */}
      <Sidebar collapsible="offcanvas" className="lg:border-r-0!">
        
        {/* Brand Header */}
        <SidebarHeader className="p-3 sm:p-4 lg:p-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-linear-to-b from-[#10b981] to-[#3b82f6] text-white">
              <ShoppingBag className="size-3.5" />
            </div>
            <span className="font-semibold text-base sm:text-lg">Berakit Portal</span>
          </div>
        </SidebarHeader>

        {/* Brand Banner Card */}
        <SidebarContent className="px-3 sm:px-4 lg:px-5 mt-4">
          <div className="flex items-center gap-2 sm:gap-3 rounded-lg border bg-card p-2 sm:p-3 mb-3 sm:mb-4">
            <div className="flex size-8 sm:size-[34px] items-center justify-center rounded-lg bg-linear-to-b from-[#10b981] to-[#3b82f6] text-white shrink-0">
              <User className="size-4 sm:size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm truncate">{displayName}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Portal Pembeli</p>
            </div>
          </div>

          <SidebarMenu>
            {buyerMenuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={activeTab === item.id}
                  className="h-9 sm:h-[38px]"
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="size-4 sm:size-5" />
                  <span className="text-sm">{item.title}</span>
                  {item.count !== undefined && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {item.count}
                    </span>
                  )}
                  {activeTab === item.id && (
                    <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-60" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
            <SidebarMenuItem className="mt-4 border-t border-zinc-100 pt-4">
              <SidebarMenuButton
                className="h-9 sm:h-[38px] text-zinc-500 hover:text-zinc-900"
                onClick={() => router.push("/")}
              >
                <Store className="size-4 sm:size-5" />
                <span className="text-sm">Kembali Ke Toko</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        {/* Footer Dropdown */}
        <SidebarFooter className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <Avatar className="size-7 sm:size-8">
                  <AvatarFallback className="text-xs bg-zinc-900 text-white font-mono">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{displayName}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                <User className="size-4 mr-2" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/")}>
                <Store className="size-4 mr-2" />
                Belanja Lagi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleSignOut}>
                <LogOut className="size-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ─── MAIN CONTENT CONTAINER (RIGHT) ─── */}
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          
          {/* Header Bar */}
          <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
            <SidebarTrigger className="-ml-1 sm:-ml-2" />
            <h1 className="text-base sm:text-lg font-medium flex-1 truncate">
              {activeTab === "overview" && "Ringkasan Portal"}
              {activeTab === "orders" && "Daftar Transaksi"}
              {activeTab === "profile" && "Edit Data Profil"}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="h-8 rounded-lg text-xs font-bold uppercase tracking-wider gap-1.5 hidden sm:flex cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Kembali ke Toko
            </Button>
          </header>

          {/* Scrollable Tab Content Panels */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-background w-full">
            
            {/* ── Tab: OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                
                {/* Welcome Card Banner */}
                <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
                    <ShoppingBag className="size-64" />
                  </div>
                  <div className="relative z-10 space-y-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#bef264] font-black uppercase">Berakit Series Customer Portal</span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                      Halo, {displayName}!
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium max-w-lg leading-relaxed">
                      Selamat datang kembali. Di sini Anda dapat memantau pengiriman batik tulis pesisir Berakit, mengunggah bukti pembayaran transfer bank, dan menyesuaikan alamat utama Anda.
                    </p>
                  </div>
                </div>

                {/* Stats Row Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { label: "Transaksi Selesai", value: `Rp ${totalSpent.toLocaleString("id-ID")}`, desc: "Jumlah belanja terverifikasi", icon: CreditCard },
                    { label: "Pesanan Aktif", value: pendingOrders.length, desc: "Pesanan diproses/dikirim", icon: ShoppingBag },
                    { label: "Member Sejak", value: new Date(user?.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), desc: "Tanggal registrasi akun", icon: Calendar },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                          <div className="size-8 rounded-full bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                            <Icon className="size-4 text-zinc-500" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{stat.value}</h3>
                          <p className="text-[10px] text-zinc-400 font-medium mt-1 leading-normal">{stat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Dua Pesanan Terakhir</h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                    >
                      <span>Lihat Semua</span>
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                  
                  {orders.length === 0 ? (
                    <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center gap-3">
                      <ShoppingBag className="size-8 text-zinc-300" />
                      <p className="text-xs text-zinc-400 font-semibold uppercase">Belum ada transaksi.</p>
                      <Button onClick={() => router.push("/product")} className="h-9 bg-black text-white hover:bg-zinc-800 text-[10px] rounded-full px-6 font-extrabold uppercase tracking-wider cursor-pointer">Belanja Sekarang</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 2).map((order) => (
                        <div key={order.id} className="border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{order.id.slice(0, 8)}...</span>
                              <span className="text-[10px] text-zinc-400 font-semibold">{new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                order.status === "Selesai"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : order.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-blue-50 text-blue-700 border-blue-100"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium">
                              {order.items && Array.isArray(order.items) 
                                ? order.items.map((it: any) => `${it.name} (x{it.quantity})`).join(", ")
                                : "Batik Eksklusif"}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                            <span className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-zinc-100">
                              Rp {Number(order.total_amount).toLocaleString("id-ID")}
                            </span>
                            {order.payment_method === "Transfer Bank" && !order.receipt_url && (
                              <Button
                                onClick={() => {
                                  setActiveTab("orders");
                                  setUploadingReceiptOrderId(order.id);
                                }}
                                className="h-8 bg-black hover:bg-zinc-900 text-white rounded-full text-[9px] px-4 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <UploadCloud className="size-3.5" />
                                Bayar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: ORDERS ── */}
            {activeTab === "orders" && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Riwayat Pesanan</h3>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{orders.length} TOTAL TRANSAKSI</span>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4">
                    <div className="size-14 rounded-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                      <ShoppingBag className="size-6 text-zinc-300" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase">Belum ada Riwayat Pesanan</h4>
                      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                        Anda belum memiliki daftar transaksi pembelian batik tulis pesisir Berakit.
                      </p>
                    </div>
                    <Button onClick={() => router.push("/product")} className="h-9 bg-black text-white hover:bg-zinc-900 text-xs rounded-full px-6 font-extrabold uppercase tracking-wider cursor-pointer">
                      Mulai Belanja
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isTransfer = order.payment_method === "Transfer Bank";
                      const isUploadingThis = uploadingReceiptOrderId === order.id;

                      return (
                        <div key={order.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                          
                          {/* Order Card Top Bar */}
                          <div className="bg-zinc-50/70 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-850 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ID TRANSAKSI</span>
                                <div className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-50">{order.id}</div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TANGGAL</span>
                                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                  {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">METODE BAYAR</span>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">{order.payment_method}</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                order.status === "Selesai"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : order.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Order Card Content */}
                          <div className="p-5 space-y-4">
                            
                            {/* Items list inside card */}
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Rincian Barang</h4>
                              <div className="space-y-1.5">
                                {order.items && Array.isArray(order.items) ? (
                                  order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-50 dark:border-zinc-850 pb-1.5 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-1.5">
                                        <span>{item.name}</span>
                                        <span className="text-zinc-400 text-[10px] font-bold uppercase font-mono">x{item.quantity}</span>
                                      </div>
                                      <span>Rp {Number(item.price * item.quantity).toLocaleString("id-ID")}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    <span>Batik Eksklusif</span>
                                    <span>Rp {Number(order.total_amount).toLocaleString("id-ID")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Delivery details and bottom options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-850 pt-3">
                              <div className="space-y-0.5">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Alamat Pengiriman</h4>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-200 block">{order.customer_name} ({order.customer_phone})</span>
                                  {order.address}
                                </p>
                              </div>
                              <div className="flex flex-col items-start md:items-end justify-between gap-3 pt-2 md:pt-0">
                                <div className="md:text-right">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TOTAL PEMBAYARAN</span>
                                  <span className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-zinc-50">
                                    Rp {Number(order.total_amount).toLocaleString("id-ID")}
                                  </span>
                                </div>
                                
                                {/* Receipt uploading/preview */}
                                {order.receipt_url ? (
                                  <a
                                    href={order.receipt_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-850"
                                  >
                                    <ExternalLink className="size-3" />
                                    <span>Lihat Bukti Transfer</span>
                                  </a>
                                ) : isTransfer ? (
                                  <div className="w-full md:w-auto">
                                    {isUploadingThis ? (
                                      <div className="space-y-3 p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="flex items-center gap-2">
                                          <UploadCloud className="size-4 text-zinc-400" />
                                          <span className="text-[11px] font-bold uppercase text-zinc-700 dark:text-zinc-300">Unggah Bukti Transfer</span>
                                        </div>
                                        <input
                                          required
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                          className="text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-black file:text-[#bef264] hover:file:opacity-90 file:cursor-pointer"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => handleReceiptUpload(order.id)}
                                            disabled={isUploading || !receiptFile}
                                            className="h-8 bg-zinc-900 text-white hover:bg-zinc-950 text-[10px] rounded-full px-4 font-black uppercase tracking-wider gap-1.5 cursor-pointer"
                                          >
                                            {isUploading ? (
                                              <Loader2 className="size-3 animate-spin text-[#bef264]" />
                                            ) : (
                                              <Check className="size-3" />
                                            )}
                                            <span>Unggah</span>
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setUploadingReceiptOrderId(null);
                                              setReceiptFile(null);
                                            }}
                                            className="h-8 border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 text-[10px] rounded-full px-4 font-bold uppercase tracking-wider cursor-pointer"
                                          >
                                            Batal
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => setUploadingReceiptOrderId(order.id)}
                                        className="h-8 bg-black hover:bg-zinc-900 text-white dark:bg-zinc-950 dark:hover:bg-zinc-900 text-[10px] rounded-full px-4 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                                      >
                                        <UploadCloud className="size-3.5" />
                                        <span>Unggah Bukti Bayar</span>
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    <span>Bayar di Tempat (COD)</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: PROFILE ── */}
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Edit Data Profil Utama</h3>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 font-medium leading-relaxed mt-1">
                    Sesuaikan nama lengkap, nomor WhatsApp, dan alamat default pengiriman barang Anda.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-450" />
                        <input
                          required
                          type="text"
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="Nama Lengkap Anda"
                          className="w-full h-10 pl-11 pr-4 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nomor HP / WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-455" />
                        <input
                          required
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="Contoh: 0812345678"
                          className="w-full h-10 pl-11 pr-4 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Alamat Pengiriman Utama</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 size-4 text-zinc-455" />
                      <textarea
                        required
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Tulis alamat rumah lengkap (RT/RW, Dusun, Desa, Kecamatan, Kabupaten, Kodepos)"
                        rows={4}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-semibold resize-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="h-10 bg-black hover:bg-zinc-900 text-white dark:bg-zinc-950 dark:hover:bg-zinc-900 rounded-lg px-6 text-xs font-extrabold uppercase tracking-widest gap-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-[#bef264]" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
