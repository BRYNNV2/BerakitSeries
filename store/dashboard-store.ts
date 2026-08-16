import { create } from "zustand";

interface DashboardState {
  activeTab: "dashboard" | "products" | "transactions" | "settings" | "logs" | "gallery" | "complaints" | "about-slides";
  setActiveTab: (tab: "dashboard" | "products" | "transactions" | "settings" | "logs" | "gallery" | "complaints" | "about-slides") => void;
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

const getInitialProfile = () => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("berakit_admin_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.avatar) {
          return {
            adminName: parsed.name || "Park Jihuu",
            adminEmail: parsed.email || "kingrembo6@gmail.com",
            adminAvatar: parsed.avatar,
          };
        }
      }
    } catch (e) {}
  }
  return {
    adminName: "Park Jihuu",
    adminEmail: "kingrembo6@gmail.com",
    adminAvatar: "https://qbxsjrtmtebxqhzhdwza.supabase.co/storage/v1/object/public/gallery/avatars/admin-avatar-1784785683754.webp",
  };
};

const initialProfile = getInitialProfile();

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
  adminName: initialProfile.adminName,
  adminEmail: initialProfile.adminEmail,
  adminAvatar: initialProfile.adminAvatar,
  setAdminProfile: (profile) => set({
    adminName: profile.name,
    adminEmail: profile.email,
    adminAvatar: profile.avatar,
  }),
  highlightItemId: null,
  setHighlightItemId: (id) => set({ highlightItemId: id }),
}));

