"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  ShoppingBag,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
  UserCircle,
  ChevronsUpDown,
  Store,
  History,
  Image as ImageIcon,
} from "lucide-react";
import { useDashboardStore } from "@/store/dashboard-store";
import { useRouter } from "next/navigation";
import { supabase, withTimeout } from "@/lib/supabase";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutGrid,
    tab: "dashboard" as const,
  },
  {
    title: "Produk Desa",
    icon: ShoppingBag,
    tab: "products" as const,
  },
  {
    title: "Galeri Desa",
    icon: ImageIcon,
    tab: "gallery" as const,
  },
  {
    title: "Transaksi",
    icon: CreditCard,
    tab: "transactions" as const,
  },
  {
    title: "Riwayat Aktivitas",
    icon: History,
    tab: "logs" as const,
  },
  {
    title: "Pengaturan",
    icon: Settings,
    tab: "settings" as const,
  },
];

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const adminName = useDashboardStore((state) => state.adminName);
  const adminEmail = useDashboardStore((state) => state.adminEmail);
  const adminAvatar = useDashboardStore((state) => state.adminAvatar);
  const setAdminProfile = useDashboardStore((state) => state.setAdminProfile);

  React.useEffect(() => {
    const fetchUser = async () => {
      // Check local profile first — skip network call if already available
      const localProfileStr = localStorage.getItem("berakit_admin_profile");
      if (localProfileStr) {
        try {
          const localProfile = JSON.parse(localProfileStr);
          setAdminProfile(localProfile);
        } catch (e) {
          console.warn("Failed to parse local profile:", e);
        }
      }

      // Only attempt Supabase auth if client exists AND we're NOT using local-only auth
      const isLocalAuth = localStorage.getItem("berakit_admin_auth") === "true";
      if (supabase && !isLocalAuth) {
        try {
          const response = await withTimeout(supabase.auth.getUser());
          const user = response?.data?.user;
          if (user) {
            const dbName = user.user_metadata?.full_name;
            const dbAvatar = user.user_metadata?.avatar_url;
            const localProfile = localProfileStr ? JSON.parse(localProfileStr) : null;

            const name = dbName || localProfile?.name || "Admin BUMDes";
            const avatar = dbAvatar || localProfile?.avatar || "https://api.dicebear.com/9.x/glass/svg?seed=Berakit";
            const email = user.email || "admin@berakit.desa.id";

            setAdminProfile({ name, email, avatar });
            localStorage.setItem("berakit_admin_profile", JSON.stringify({ name, email, avatar }));
          }
        } catch (err) {
          // Silently ignore — local profile already loaded above
        }
      }
    };
    fetchUser();
  }, [setAdminProfile]);

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem("berakit_admin_auth");
        router.push("/login");
      } catch (err) {
        console.error("Sign out error:", err);
      }
    } else {
      localStorage.removeItem("berakit_admin_auth");
      router.push("/login");
    }
  };

  return (
    <Sidebar collapsible="offcanvas" className="lg:border-r-0!" {...props}>
      <SidebarHeader className="p-3 sm:p-4 lg:p-5 pb-0">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-linear-to-b from-[#6e3ff3] to-[#aa8ef9] text-white">
            <Store className="size-3.5" />
          </div>
          <span className="font-semibold text-base sm:text-lg">Berakit Hub</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 sm:px-4 lg:px-5 mt-4">
        <div className="flex items-center gap-2 sm:gap-3 rounded-lg border bg-card p-2 sm:p-3 mb-3 sm:mb-4">
          <div className="flex size-8 sm:size-[34px] items-center justify-center rounded-lg bg-linear-to-b from-[#6e3ff3] to-[#aa8ef9] text-white shrink-0">
            <Store className="size-4 sm:size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs sm:text-sm">BUMDes Berakit</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                     isActive={activeTab === item.tab}
                     className="h-9 sm:h-[38px]"
                     onClick={() => setActiveTab(item.tab)}
                  >
                    <item.icon className="size-4 sm:size-5" />
                    <span className="text-sm">{item.title}</span>
                    {activeTab === item.tab && (
                      <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-60" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <Avatar className="size-7 sm:size-8 notranslate" translate="no">
                <AvatarImage src={adminAvatar} />
                <AvatarFallback className="text-xs"><span>{adminName.slice(0, 2).toUpperCase()}</span></AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm truncate">{adminName}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {adminEmail}
                </p>
              </div>
              <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => setActiveTab("settings")}>
              <UserCircle className="size-4 mr-2" />
              Profil Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("settings")}>
              <Settings className="size-4 mr-2" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
              <LogOut className="size-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

