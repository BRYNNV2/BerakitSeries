import { create } from "zustand";

interface DashboardState {
  activeTab: "dashboard" | "products" | "transactions" | "settings" | "logs" | "gallery" | "complaints";
  setActiveTab: (tab: "dashboard" | "products" | "transactions" | "settings" | "logs" | "gallery" | "complaints") => void;
  searchQuery: string;
  stageFilter: string;
  ownerFilter: string;
  valueFilter: string;
  setSearchQuery: (query: string) => void;
  setStageFilter: (filter: string) => void;
  setOwnerFilter: (filter: string) => void;
  setValueFilter: (filter: string) => void;
  clearFilters: () => void;
  // Profile settings
  adminName: string;
  adminEmail: string;
  adminAvatar: string;
  setAdminProfile: (profile: { name: string; email: string; avatar: string }) => void;
  // Item highlighting
  highlightItemId: string | null;
  setHighlightItemId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: "",
  stageFilter: "all",
  ownerFilter: "all",
  valueFilter: "all",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStageFilter: (filter) => set({ stageFilter: filter }),
  setOwnerFilter: (filter) => set({ ownerFilter: filter }),
  setValueFilter: (filter) => set({ valueFilter: filter }),
  clearFilters: () =>
    set({
      searchQuery: "",
      stageFilter: "all",
      ownerFilter: "all",
      valueFilter: "all",
    }),
  adminName: "Admin BUMDes",
  adminEmail: "admin@berakit.desa.id",
  adminAvatar: "https://api.dicebear.com/9.x/glass/svg?seed=Berakit",
  setAdminProfile: (profile) => set({
    adminName: profile.name,
    adminEmail: profile.email,
    adminAvatar: profile.avatar,
  }),
  highlightItemId: null,
  setHighlightItemId: (id) => set({ highlightItemId: id }),
}));

