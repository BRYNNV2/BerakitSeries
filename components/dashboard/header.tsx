"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MessageSquare,
  UserPlus,
  Command,
  MoreVertical,
  Package,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import { useDashboardStore } from "@/store/dashboard-store";
import { supabase } from "@/lib/supabase";

export function DashboardHeader() {
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const setHighlightItemId = useDashboardStore((state) => state.setHighlightItemId);

  const [products, setProducts] = React.useState<any[]>([]);
  const [gallery, setGallery] = React.useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<any[]>([]);
  const [filteredGallery, setFilteredGallery] = React.useState<any[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const loadSearchData = async () => {
    try {
      const hasCredentials = !!supabase;
      if (hasCredentials) {
        const { data: prodData } = await supabase
          .from("products")
          .select("id, name, category, price, image_url");
        const { data: gallData } = await supabase
          .from("gallery")
          .select("id, title, category, image_url");
        setProducts(prodData || []);
        setGallery(gallData || []);
      } else {
        const localProducts = JSON.parse(localStorage.getItem("berakit_products") || "[]");
        const localGallery = JSON.parse(localStorage.getItem("berakit_gallery") || "[]");
        setProducts(localProducts);
        setGallery(localGallery);
      }
    } catch (err) {
      console.warn("Failed to load search data:", err);
    }
  };

  React.useEffect(() => {
    loadSearchData();
  }, []);

  React.useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setFilteredProducts([]);
      setFilteredGallery([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const matchesProd = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
    const matchesGall = gallery.filter(
      (g) =>
        g.title?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q)
    );

    setFilteredProducts(matchesProd.slice(0, 5));
    setFilteredGallery(matchesGall.slice(0, 5));
  }, [searchQuery, products, gallery]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (tab: "products" | "gallery", id: string) => {
    setActiveTab(tab);
    setHighlightItemId(id);
    setIsOpen(false);
  };

  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
      <SidebarTrigger className="-ml-1 sm:-ml-2" />
      <h1 className="text-base sm:text-lg font-medium flex-1 truncate">Dashboard</h1>

      <div className="hidden md:block relative" ref={dropdownRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          placeholder="Cari produk / galeri..."
          className="pl-10 pr-14 w-[200px] lg:w-[260px] h-9 bg-card border"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            loadSearchData();
            setIsOpen(true);
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-muted px-1 py-0.5 rounded text-xs text-muted-foreground pointer-events-none">
          <Command className="size-3" />
          <span>K</span>
        </div>

        {/* Floating Autocomplete Dropdown */}
        {isOpen && (filteredProducts.length > 0 || filteredGallery.length > 0) && (
          <div className="absolute top-11 left-0 w-[380px] bg-white dark:bg-zinc-950 border rounded-xl shadow-2xl p-4 space-y-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Products Category */}
            {filteredProducts.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Produk Desa ({filteredProducts.length})
                </span>
                <div className="space-y-1">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleItemClick("products", p.id)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer group transition-all"
                    >
                      <div className="size-8 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 border">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="size-full object-cover" />
                        ) : (
                          <Package className="size-4 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                          {p.category}
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zinc-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Category */}
            {filteredGallery.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Galeri Dokumentasi ({filteredGallery.length})
                </span>
                <div className="space-y-1">
                  {filteredGallery.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => handleItemClick("gallery", g.id)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer group transition-all"
                    >
                      <div className="size-8 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 border">
                        {g.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.image_url} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageIcon className="size-4 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 truncate">
                          {g.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                          {g.category}
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zinc-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Search className="size-4 mr-2" />
            Search
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MessageSquare className="size-4 mr-2" />
            Messages
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPlus className="size-4 mr-2" />
            Invite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
