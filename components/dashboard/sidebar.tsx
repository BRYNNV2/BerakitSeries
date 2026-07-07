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
} from "lucide-react";
import { useDashboardStore } from "@/store/dashboard-store";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    title: "Transaksi",
    icon: CreditCard,
    tab: "transactions" as const,
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

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
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
              <Avatar className="size-7 sm:size-8">
                <AvatarImage src="https://api.dicebear.com/9.x/glass/svg?seed=Berakit" />
                <AvatarFallback className="text-xs">AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm">Admin BUMDes</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  admin@berakit.desa.id
                </p>
              </div>
              <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem>
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

