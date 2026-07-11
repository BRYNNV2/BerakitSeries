export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  type: "product" | "transaction" | "settings" | "system" | "gallery";
  timestamp: string;
  adminName: string;
}

// Default mock logs to populate if empty
const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: "log-1",
    action: "Sistem Dimulai",
    details: "Dashboard BUMDes Berakit berhasil diinisialisasi",
    type: "system",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    adminName: "System",
  },
  {
    id: "log-2",
    action: "Update Stok Produk",
    details: "Stok produk 'Keripik Gonggong Pedas' diubah menjadi 25 unit",
    type: "product",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    adminName: "Admin BUMDes",
  },
  {
    id: "log-3",
    action: "Konfirmasi Pesanan",
    details: "Mengubah status transaksi pesanan #TRX-9821 menjadi 'Diproses'",
    type: "transaction",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    adminName: "Admin BUMDes",
  },
  {
    id: "log-4",
    action: "Update Pengaturan",
    details: "Mengubah alamat pengiriman flat rate BUMDes",
    type: "settings",
    timestamp: new Date(Date.now() - 600000 * 15).toISOString(), // 15 mins ago
    adminName: "Admin BUMDes",
  },
];

export const getActivityLogs = (): ActivityLog[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("berakit_activity_logs");
  if (!stored) {
    localStorage.setItem("berakit_activity_logs", JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_LOGS;
  }
};

export const addActivityLog = (
  action: string,
  details: string,
  type: "product" | "transaction" | "settings" | "system" | "gallery"
): void => {
  if (typeof window === "undefined") return;
  const logs = getActivityLogs();
  
  // Get admin name from profile
  let adminName = "Admin BUMDes";
  const profileStr = localStorage.getItem("berakit_admin_profile");
  if (profileStr) {
    try {
      const profile = JSON.parse(profileStr);
      if (profile.name) adminName = profile.name;
    } catch {}
  }

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    details,
    type,
    timestamp: new Date().toISOString(),
    adminName,
  };

  const updatedLogs = [newLog, ...logs].slice(0, 100); // Keep last 100 logs
  localStorage.setItem("berakit_activity_logs", JSON.stringify(updatedLogs));

  // Dispatch a custom event to notify components that logs updated
  window.dispatchEvent(new Event("activity_logs_updated"));
};

export const clearActivityLogs = (): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("berakit_activity_logs", JSON.stringify([]));
  window.dispatchEvent(new Event("activity_logs_updated"));
};
