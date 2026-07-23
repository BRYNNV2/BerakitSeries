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
  Truck,
  Lock,
  Plus,
  Trash,
  Edit,
  Mail,
  Key,
  Home,
  Briefcase,
  Camera,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/glass/svg?seed=Batik",
  "https://api.dicebear.com/9.x/glass/svg?seed=Berakit",
  "https://api.dicebear.com/9.x/glass/svg?seed=Pesisir",
  "https://api.dicebear.com/9.x/glass/svg?seed=Tanjungpinang",
  "https://api.dicebear.com/9.x/glass/svg?seed=Kepri",
  "https://api.dicebear.com/9.x/glass/svg?seed=Melayu",
];

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
  const [activeTab, setActiveTab] = React.useState<"overview" | "orders" | "profile" | "support">("overview");

  // Support & Resolution states
  const [complaintOrderId, setComplaintOrderId] = React.useState("");
  const [complaintType, setComplaintType] = React.useState("Barang Rusak / Cacat");
  const [complaintDescription, setComplaintDescription] = React.useState("");
  const [complaintProofUrl, setComplaintProofUrl] = React.useState("");
  const [isUploadingComplaintProof, setIsUploadingComplaintProof] = React.useState(false);
  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = React.useState(false);

  // Sub-tab selection within profile tab
  const [profileSubTab, setProfileSubTab] = React.useState<"info" | "password" | "addresses">("info");

  // Custom avatar states
  const [avatarUrl, setAvatarUrl] = React.useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  // Password change states
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

  // Address Book states
  const [addresses, setAddresses] = React.useState<any[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<any | null>(null);

  // Address form states
  const [addressLabel, setAddressLabel] = React.useState("Rumah");
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientPhone, setRecipientPhone] = React.useState("");
  const [addressLine, setAddressLine] = React.useState("");
  const [isAddressPrimary, setIsAddressPrimary] = React.useState(false);

  // Tracking modal state
  const [isTrackDialogOpen, setIsTrackDialogOpen] = React.useState(false);
  const [trackingOrder, setTrackingOrder] = React.useState<any>(null);
  const [confirmingOrderId, setConfirmingOrderId] = React.useState<string | null>(null);

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

        let loadedAvatar = "";
        if (!profileErr && profileData) {
          setProfile(profileData);
          setFullNameInput(profileData.full_name || "");
          setPhoneInput(profileData.phone || "");
          setAddressInput(profileData.address || "");
          loadedAvatar = profileData.avatar_url || "";
        } else {
          // If no profile row exists yet, initialize inputs with email
          setFullNameInput(currentUser.email?.split("@")[0] || "");
        }

        // Check local avatar fallback
        const localAvatar = localStorage.getItem(`berakit_avatar_${currentUser.id}`);
        if (localAvatar) {
          loadedAvatar = localAvatar;
        }
        setAvatarUrl(loadedAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");

        // Load Address Book
        loadAddresses(currentUser.id);

        // Fetch User Orders
        const { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (!ordersErr && ordersData) {
          setOrders(ordersData);
        }

        // Load Complaints
        loadComplaints(currentUser.id);
      } catch (err) {
        console.error("Gagal menginisialisasi dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  const loadAddresses = async (userId: string) => {
    let loadedAddresses: any[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", userId)
          .order("is_primary", { ascending: false });
          
        if (!error && data) {
          loadedAddresses = data;
        }
      } catch (err) {
        console.warn("Supabase addresses fetch failed, checking local storage fallback:", err);
      }
    }
    
    // Load from localStorage as fallback or merge
    const localAddrsStr = localStorage.getItem(`berakit_addresses_${userId}`);
    if (localAddrsStr) {
      try {
        const localAddrs = JSON.parse(localAddrsStr);
        localAddrs.forEach((la: any) => {
          if (!loadedAddresses.some(a => a.id === la.id)) {
            loadedAddresses.push(la);
          }
        });
      } catch (e) {
        console.error("Failed to parse local addresses", e);
      }
    }
    
    // Sort so primary addresses are first
    loadedAddresses.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    setAddresses(loadedAddresses);
  };

  const loadComplaints = async (userId: string) => {
    try {
      let list: any[] = [];
      if (supabase) {
        const { data, error } = await supabase
          .from("complaints")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!error && data) list = data;
      }
      
      const localComplaintsStr = localStorage.getItem(`berakit_complaints_${userId}`);
      if (localComplaintsStr) {
        const localComplaints = JSON.parse(localComplaintsStr);
        localComplaints.forEach((lc: any) => {
          if (!list.some(c => c.id === lc.id)) {
            list.push(lc);
          }
        });
      }
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComplaints(list);
    } catch (e) {
      console.warn("Failed loading complaints:", e);
    }
  };

  const handleComplaintProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingComplaintProof(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_complaint_${Date.now()}.${fileExt}`;
      const bucket = "receipts";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("path", fileName);

      const res = await fetch("/api/storage", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Proxy upload failed");
      }

      const { data, error } = await res.json();
      if (error) throw new Error(error);

      if (data?.publicUrl) {
        setComplaintProofUrl(data.publicUrl);
        toast.success("Foto bukti komplain berhasil diunggah!");
      }
    } catch (err: any) {
      console.warn("Proxy upload failed, converting to local base64 url:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setComplaintProofUrl(base64data);
        toast.success("Foto bukti komplain disimpan secara lokal.");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingComplaintProof(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!complaintOrderId) {
      toast.error("Silakan pilih ID Transaksi untuk komplain Anda.");
      return;
    }
    if (!complaintDescription.trim()) {
      toast.error("Silakan isi rincian komplain Anda.");
      return;
    }

    setIsSubmittingComplaint(true);
    const newComplaint = {
      id: `ticket-${Date.now()}`,
      user_id: user.id,
      order_id: complaintOrderId,
      type: complaintType,
      description: complaintDescription,
      proof_url: complaintProofUrl || null,
      status: "Menunggu Review",
      admin_response: null,
      created_at: new Date().toISOString()
    };

    let dbSuccess = false;
    if (supabase) {
      try {
        const { error } = await supabase
          .from("complaints")
          .insert([newComplaint]);
        if (!error) {
          dbSuccess = true;
        } else {
          console.warn("Failed to save complaint to Supabase, falling back to local storage:", error);
        }
      } catch (err) {
        console.warn("Failed to save complaint to database, using local storage:", err);
      }
    }

    try {
      // Mirror / Fallback to local storage
      const localKey = `berakit_complaints_${user.id}`;
      const existingStr = localStorage.getItem(localKey);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(newComplaint);
      localStorage.setItem(localKey, JSON.stringify(existing));
      
      // Update state
      setComplaints(prev => {
        const updated = [...prev];
        if (!updated.some(c => c.id === newComplaint.id)) {
          updated.unshift(newComplaint);
        }
        return updated;
      });

      toast.success(dbSuccess ? "Komplain berhasil dikirim ke Admin!" : "Komplain disimpan secara lokal & akan disinkronkan nanti.");
      
      // Clear inputs
      setComplaintOrderId("");
      setComplaintDescription("");
      setComplaintProofUrl("");
    } catch (e) {
      console.error("Failed saving complaint locally:", e);
      toast.error("Gagal mengirim komplain.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

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
        avatar_url: avatarUrl,
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

      // Safe fallback if avatar_url column is missing in Supabase profiles schema
      if (error && error.message && error.message.includes("avatar_url")) {
        console.warn("avatar_url column missing from profiles table. Falling back to local storage for avatar.");
        const cleanPayload = { ...updatedProfile };
        delete (cleanPayload as any).avatar_url;
        
        let retryError = null;
        if (existingProfile) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update(cleanPayload)
            .eq("id", user.id);
          retryError = updateErr;
        } else {
          const { error: insertErr } = await supabase
            .from("profiles")
            .insert([cleanPayload]);
          retryError = insertErr;
        }
        error = retryError;
        localStorage.setItem(`berakit_avatar_${user.id}`, avatarUrl);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingAvatar(true);
    try {
      if (supabase) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}_avatar_${Date.now()}.${fileExt}`;
        let bucket = "avatars";
        let uploadError = null;
        
        // Try uploading to 'avatars' bucket first
        let { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: "3600", upsert: true });
          
        if (error) {
          // Fallback to 'receipts' bucket if 'avatars' bucket is missing
          bucket = "receipts";
          const { error: fallbackError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { cacheControl: "3600", upsert: true });
          uploadError = fallbackError;
        }
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
          
        setAvatarUrl(publicUrl);
        localStorage.setItem(`berakit_avatar_${user.id}`, publicUrl);
        toast.success("Foto profil berhasil diunggah!");
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAvatarUrl(base64data);
          localStorage.setItem(`berakit_avatar_${user.id}`, base64data);
          toast.success("Foto profil disimpan secara lokal!");
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn("Gagal mengunggah foto ke cloud, menyimpan sebagai data local url:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setAvatarUrl(base64data);
        localStorage.setItem(`berakit_avatar_${user.id}`, base64data);
        toast.success("Foto profil disimpan secara lokal.");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Kata sandi Anda berhasil diperbarui!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Metode pengubahan kata sandi tidak didukung dalam mode lokal offline.");
      }
    } catch (err: any) {
      console.error("Gagal memperbarui kata sandi:", err);
      toast.error("Gagal memperbarui kata sandi: " + (err.message || err));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const newAddressId = editingAddress?.id || `addr-${Date.now()}`;
    const addressPayload = {
      id: newAddressId,
      user_id: user.id,
      label: addressLabel,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      address_line: addressLine,
      is_primary: isAddressPrimary
    };
    
    let dbSuccess = false;
    if (supabase) {
      try {
        if (isAddressPrimary) {
          // Unset other primary addresses first
          await supabase
            .from("addresses")
            .update({ is_primary: false })
            .eq("user_id", user.id);
        }
        
        let error = null;
        if (editingAddress) {
          const { error: err } = await supabase
            .from("addresses")
            .update(addressPayload)
            .eq("id", editingAddress.id);
          error = err;
        } else {
          const { error: err } = await supabase
            .from("addresses")
            .insert([addressPayload]);
          error = err;
        }
        
        if (!error) {
          dbSuccess = true;
        }
      } catch (err) {
        console.warn("Supabase address operation failed:", err);
      }
    }
    
    // Sync with localStorage (works either as fallback or backup)
    try {
      const localKey = `berakit_addresses_${user.id}`;
      const localAddrsStr = localStorage.getItem(localKey);
      let currentLocal: any[] = localAddrsStr ? JSON.parse(localAddrsStr) : [];
      
      if (isAddressPrimary) {
        currentLocal = currentLocal.map(a => ({ ...a, is_primary: false }));
      }
      
      if (editingAddress) {
        currentLocal = currentLocal.map(a => a.id === editingAddress.id ? addressPayload : a);
      } else {
        currentLocal.push(addressPayload);
      }
      
      localStorage.setItem(localKey, JSON.stringify(currentLocal));
      toast.success(editingAddress ? "Alamat berhasil diperbarui!" : "Alamat baru berhasil ditambahkan!");
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      loadAddresses(user.id);
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan alamat.");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    
    if (supabase) {
      try {
        await supabase
          .from("addresses")
          .delete()
          .eq("id", addressId);
      } catch (err) {
        console.warn("Supabase address delete failed:", err);
      }
    }
    
    try {
      const localKey = `berakit_addresses_${user.id}`;
      const localAddrsStr = localStorage.getItem(localKey);
      if (localAddrsStr) {
        const currentLocal = JSON.parse(localAddrsStr);
        const filtered = currentLocal.filter((a: any) => a.id !== addressId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }
      toast.success("Alamat berhasil dihapus.");
      loadAddresses(user.id);
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus alamat.");
    }
  };

  const handleSetPrimaryAddress = async (address: any) => {
    if (!user) return;
    
    const updatedAddress = { ...address, is_primary: true };
    
    if (supabase) {
      try {
        await supabase
          .from("addresses")
          .update({ is_primary: false })
          .eq("user_id", user.id);
          
        await supabase
          .from("addresses")
          .update({ is_primary: true })
          .eq("id", address.id);
      } catch (err) {
        console.warn("Supabase set primary address failed:", err);
      }
    }
    
    try {
      const localKey = `berakit_addresses_${user.id}`;
      const localAddrsStr = localStorage.getItem(localKey);
      if (localAddrsStr) {
        const currentLocal = JSON.parse(localAddrsStr);
        const updated = currentLocal.map((a: any) => ({
          ...a,
          is_primary: a.id === address.id
        }));
        localStorage.setItem(localKey, JSON.stringify(updated));
      }
      toast.success("Alamat utama berhasil diubah.");
      loadAddresses(user.id);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui alamat utama.");
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

  const handlePrintUserReceipt = (order: any) => {
    let itemsList: any[] = [];
    if (typeof order.items === "string") {
      try { itemsList = JSON.parse(order.items); } catch (e) {}
    } else if (Array.isArray(order.items)) {
      itemsList = order.items;
    }

    let courier = "Ekspedisi";
    let resi = `RES-${order.id.replace(/\D/g, "").slice(-6) || "001"}`;
    if (order.status && order.status.startsWith("Dikirim")) {
      const parts = order.status.split(":");
      const trackingParts = parts[1]?.split("|") || [];
      courier = trackingParts[0]?.trim() || "Ekspedisi";
      resi = trackingParts[1]?.trim() || resi;
    }

    const itemsHtml = itemsList.map((item: any, idx: number) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 11px;">${idx + 1}. ${item.name} ${item.selected_size ? `(${item.selected_size})` : ''}</td>
        <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 11px; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 6px; border: 1px solid #e5e7eb; font-size: 11px; text-align: right;">Rp ${(item.price || 0).toLocaleString("id-ID")}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bukti Resi & Pembelian #${order.id} - BERAKIT SERIES</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; color: #111827; background: #fff; margin: 0; }
            .label-card { border: 2px solid #111827; border-radius: 12px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: none; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #166534; }
            .sub-brand { font-size: 9px; text-transform: uppercase; color: #4b5563; font-weight: 700; }
            .barcode-box { text-align: right; }
            .barcode-text { font-family: monospace; font-size: 13px; font-weight: bold; letter-spacing: 2px; background: #f3f4f6; padding: 4px 10px; border-radius: 6px; display: inline-block; border: 1px solid #d1d5db; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 11px; }
            .box-title { font-weight: 800; text-transform: uppercase; font-size: 9.5px; color: #6b7280; margin-bottom: 4px; letter-spacing: 0.5px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            .info-table th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; padding: 6px; text-align: left; border: 1px solid #e5e7eb; }
            .footer-note { background: #fefce8; border: 1px solid #fef08a; padding: 10px; border-radius: 8px; font-size: 9.5px; color: #854d0e; text-align: center; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <div>
                <div class="brand">BUMDES BERAKIT MAJU</div>
                <div class="sub-brand">BERAKIT SERIES // BUKTI PESANAN & KARTU RETUR PEMBELI</div>
              </div>
              <div class="barcode-box">
                <div class="barcode-text">${resi}</div>
                <div style="font-size: 9px; color: #6b7280; margin-top: 4px; font-weight: bold;">KURIR: ${courier.toUpperCase()}</div>
              </div>
            </div>

            <div class="grid">
              <div class="box">
                <div class="box-title">📍 PENGIRIM (SENDER)</div>
                <strong>BUMDes Berakit Maju (BUMDes Official)</strong><br />
                Jl. Wisata Pengudang-Berakit, Teluk Sebong<br />
                Kabupaten Bintan, Kepulauan Riau (29153)<br />
                Telp: 0812-3456-7890
              </div>
              <div class="box">
                <div class="box-title">👤 PEMBELI (BUYER)</div>
                <strong style="font-size: 12px; color: #111827;">${order.customer_name || "Pelanggan BUMDes"}</strong><br />
                Telp: <strong>${order.customer_phone || "-"}</strong><br />
                ${order.address || "-"}
              </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; font-size: 10.5px; display: flex; justify-content: space-between;">
              <div><strong>ORDER ID:</strong> ${order.id}</div>
              <div><strong>PEMBAYARAN:</strong> ${order.payment_method}</div>
              <div><strong>TOTAL:</strong> Rp ${(order.total_amount || 0).toLocaleString("id-ID")}</div>
            </div>

            <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; color: #374151;">Rincian Barang Dipesan:</div>
            <table class="info-table">
              <thead>
                <tr>
                  <th>Nama Produk</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Harga</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="footer-note">
              🛡️ BUKTI RESMI PEMBELIAN & KARTU RETUR GARANSI BUMDES BERAKIT<br />
              <span style="font-weight: normal; font-size: 9px;">Simpan bukti resi/nota ini sebagai dokumen klaim retur atau garansi barang jika terjadi kendala pengiriman.</span>
            </div>
          </div>
        </body>
      </html>
    `;

    let iframe = document.getElementById("buyer-dashboard-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "buyer-dashboard-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      toast.success(`Dokumen Bukti Resi #${order.id} siap dicetak / disimpan PDF.`);
    }, 250);
  };

  const getOrderStep = (statusStr: string) => {
    let displayStatus = statusStr || "Pending";
    let courierName = "";
    let trackingNumber = "";
    let currentStep = 0; // 0: Pending, 1: Diproses, 2: Dikirim, 3: Selesai

    if (statusStr && statusStr.startsWith("Dikirim")) {
      displayStatus = "Dikirim";
      currentStep = 2;
      if (statusStr.includes(":")) {
        const parts = statusStr.split(":");
        const trackingParts = parts[1].split("|");
        courierName = trackingParts[0]?.trim() || "";
        trackingNumber = trackingParts[1]?.trim() || "";
      }
    } else if (statusStr === "Diproses") {
      displayStatus = "Dikemas";
      currentStep = 1;
    } else if (statusStr === "Selesai") {
      displayStatus = "Selesai";
      currentStep = 3;
    } else if (statusStr === "Pending") {
      displayStatus = "Dipesan";
      currentStep = 0;
    } else if (statusStr === "Dibatalkan" || statusStr === "Batal") {
      displayStatus = "Dibatalkan";
      currentStep = 0;
    }
    
    return { displayStatus, courierName, trackingNumber, currentStep };
  };

  const handleConfirmReceived = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    try {
      if (supabase) {
        const { error } = await supabase
          .from("orders")
          .update({ status: "Selesai" })
          .eq("id", orderId);

        if (error) throw error;

        toast.success("Terima kasih! Pesanan Anda telah selesai.");
        
        // Refresh orders list locally
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Selesai" } : o));
      } else {
        const localTx = localStorage.getItem("berakit_transactions");
        if (localTx) {
          const parsed = JSON.parse(localTx);
          const updated = parsed.map((o: any) => o.id === orderId ? { ...o, status: "Selesai" } : o);
          localStorage.setItem("berakit_transactions", JSON.stringify(updated));
          setOrders(updated);
        }
        toast.success("Terima kasih! Pesanan Anda telah selesai (Local).");
      }
    } catch (err: any) {
      console.error("Gagal menyelesaikan order:", err);
      toast.error("Gagal memperbarui status: " + (err.message || err));
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleReorder = (order: any) => {
    if (!order.items || !Array.isArray(order.items)) {
      toast.error("Rincian barang tidak tersedia untuk dibeli kembali.");
      return;
    }

    try {
      const savedCartStr = localStorage.getItem("berakit_cart");
      let currentCart: any[] = [];
      if (savedCartStr) {
        currentCart = JSON.parse(savedCartStr);
      }

      order.items.forEach((item: any) => {
        const newCartItem = {
          product: {
            id: item.product_id,
            name: item.name,
            price: item.price,
            image_url: item.image_url || "/batik-center.png",
            selectedSize: item.selected_size || null,
            description: "",
            category: "",
            stock: 99,
            has_sizes: !!item.selected_size
          },
          quantity: item.quantity
        };

        const existingIdx = currentCart.findIndex(
          (c) => c.product.id === item.product_id && c.product.selectedSize === item.selected_size
        );

        if (existingIdx > -1) {
          currentCart[existingIdx].quantity += item.quantity;
        } else {
          currentCart.push(newCartItem);
        }
      });

      localStorage.setItem("berakit_cart", JSON.stringify(currentCart));
      toast.success("Barang berhasil ditambahkan ke keranjang belanja Anda!");
      router.push("/product?openCart=true");
    } catch (e) {
      console.error("Reorder failed:", e);
      toast.error("Gagal melakukan pembelian ulang.");
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
    { id: "overview" as const, title: "Dashboard", icon: LayoutGrid },
    { id: "orders" as const, title: "Pesanan Saya", icon: ShoppingBag, count: orders.length },
    { id: "profile" as const, title: "Ubah Profil", icon: User },
    { id: "support" as const, title: "Pusat Bantuan", icon: Phone },
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
            <div className="flex size-8 sm:size-[34px] items-center justify-center rounded-lg bg-linear-to-b from-[#10b981] to-[#3b82f6] text-white shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                <User className="size-4 sm:size-5" />
              )}
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
                <Avatar className="size-7 sm:size-8 notranslate" translate="no">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-xs bg-zinc-900 text-white font-mono"><span>{userInitials}</span></AvatarFallback>
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
              {activeTab === "overview" && "Dashboard"}
              {activeTab === "orders" && "Daftar Transaksi"}
              {activeTab === "profile" && "Edit Data Profil"}
              {activeTab === "support" && "Pusat Bantuan & Resolusi"}
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
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-background w-full">
            
            {/* ── Tab: OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                
                {/* Clean Typography Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-[#10b981] font-black uppercase">Berakit Series Customer Portal</span>
                    <h2 className="text-xl sm:text-[22px] font-bold leading-tight tracking-tight">
                      Halo, {displayName}!
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Selamat datang kembali. Berikut adalah ringkasan transaksi belanja dan status akun Anda.
                    </p>
                  </div>
                </div>

                {/* Neat Stats Row with Dividers (Admin Style) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
                  {[
                    {
                      title: "Transaksi Selesai",
                      value: `Rp ${totalSpent.toLocaleString("id-ID")}`,
                      subtitle: "Jumlah belanja terverifikasi",
                      icon: CreditCard,
                      color: "text-emerald-500",
                    },
                    {
                      title: "Pesanan Aktif",
                      value: pendingOrders.length.toString(),
                      subtitle: "Pesanan diproses/dikirim",
                      icon: ShoppingBag,
                      color: "text-blue-500",
                    },
                    {
                      title: "Total Pesanan",
                      value: orders.length.toString(),
                      subtitle: "Seluruh transaksi Anda",
                      icon: Clock,
                      color: "text-purple-500",
                    },
                    {
                      title: "Member Sejak",
                      value: new Date(user?.created_at || Date.now()).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                      subtitle: "Tanggal registrasi akun",
                      icon: Calendar,
                      color: "text-amber-500",
                    },
                  ].map((card, index, arr) => (
                    <div key={card.title} className="flex items-start">
                      <div className="flex-1 space-y-2 sm:space-y-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <card.icon className={`size-3.5 sm:size-[18px] ${card.color}`} />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">{card.title}</span>
                        </div>
                        <p className="text-base sm:text-xl lg:text-[22px] font-bold leading-tight tracking-tight text-foreground truncate">
                          {card.value}
                        </p>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          {card.subtitle}
                        </div>
                      </div>
                      {index < arr.length - 1 && (
                        <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Side-by-Side Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Recent Orders (2 Columns on Large Screens) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border bg-card">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                            <ShoppingBag className="size-4 text-[#10b981]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold">Pesanan Terakhir</h3>
                            <p className="text-[10px] text-muted-foreground">Dua transaksi terbaru Anda</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("orders")}
                          className="h-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                        >
                          Lihat Semua <ChevronRight className="size-3" />
                        </Button>
                      </div>

                      <div className="p-4">
                        {orders.length === 0 ? (
                          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                            <ShoppingBag className="size-8 text-zinc-300" />
                            <p className="text-xs text-zinc-450 font-semibold uppercase">Belum ada transaksi.</p>
                            <Button onClick={() => router.push("/")} className="h-9 bg-black text-white hover:bg-zinc-850 text-[10px] rounded-full px-6 font-extrabold uppercase tracking-wider cursor-pointer">Belanja Sekarang</Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {orders.slice(0, 2).map((order) => {
                              const isTransfer = order.payment_method === "Transfer Bank";
                              const isUploadingThis = uploadingReceiptOrderId === order.id;

                              return (
                                <div key={order.id} className="border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">#{order.id.slice(0, 8)}...</span>
                                      <span className="text-[10px] text-zinc-400 font-semibold">
                                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
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
                                        ? order.items.map((it: any) => `${it.name} (x${it.quantity})`).join(", ")
                                        : "Batik Tulis Eksklusif"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                                    <span className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-zinc-100">
                                      Rp {Number(order.total_amount).toLocaleString("id-ID")}
                                    </span>
                                    {order.payment_method === "Transfer Bank" && !order.receipt_url && (
                                      <div className="w-full sm:w-auto flex justify-end">
                                        {isUploadingThis ? (
                                          <div className="space-y-2 p-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 w-full max-w-[240px]">
                                            <input
                                              required
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                              className="text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-black file:text-white hover:file:opacity-90 file:cursor-pointer w-full"
                                            />
                                            <div className="flex gap-1.5 justify-end">
                                              <Button
                                                onClick={() => handleReceiptUpload(order.id)}
                                                disabled={isUploading || !receiptFile}
                                                className="h-7 bg-black hover:bg-zinc-900 text-white rounded px-3 text-[9px] font-black uppercase tracking-wider gap-1 cursor-pointer"
                                              >
                                                {isUploading ? (
                                                  <Loader2 className="size-3 animate-spin text-[#bef264]" />
                                                ) : (
                                                  <Check className="size-3" />
                                                )}
                                                <span>Kirim</span>
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setUploadingReceiptOrderId(null);
                                                  setReceiptFile(null);
                                                }}
                                                className="h-7 text-[9px] rounded px-3 font-bold uppercase tracking-wider cursor-pointer"
                                              >
                                                Batal
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <Button
                                            onClick={() => setUploadingReceiptOrderId(order.id)}
                                            className="h-8 bg-black hover:bg-zinc-900 text-white rounded-full text-[9px] px-4 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                          >
                                            <UploadCloud className="size-3.5" />
                                            Bayar
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: User Profile Summary (1 Column on Large Screens) */}
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-card">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                            <User className="size-4 text-[#10b981]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold">Informasi Akun</h3>
                            <p className="text-[10px] text-muted-foreground">Detail profil & alamat kirim</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("profile")}
                          className="h-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                        >
                          Ubah <ChevronRight className="size-3" />
                        </Button>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-200">
                              {userInitials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-foreground truncate">{displayName}</h4>
                              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                            </div>
                          </div>

                          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                          <div className="space-y-2.5">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Nomor WhatsApp</span>
                              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                <Phone className="size-3.5 text-muted-foreground shrink-0" />
                                <span>{profile.phone || "Belum diatur"}</span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Alamat Pengiriman Utama</span>
                              <div className="flex items-start gap-2 text-xs font-semibold text-foreground leading-relaxed">
                                <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <span>{profile.address || "Belum diatur. Silakan atur alamat pengiriman utama Anda."}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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
                      const shippingInfo = getOrderStep(order.status);

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
                                shippingInfo.displayStatus === "Selesai"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
                                  : shippingInfo.displayStatus === "Dipesan"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
                                  : shippingInfo.displayStatus === "Dikirim"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800"
                                  : shippingInfo.displayStatus === "Dibatalkan"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800"
                                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
                              }`}>
                                {shippingInfo.displayStatus}
                              </span>
                            </div>
                          </div>

                          {/* Order Card Content */}
                          <div className="p-5 space-y-4">
                            
                            {/* Items list inside card */}
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Rincian Barang</h4>
                              <div className="space-y-3">
                                {order.items && Array.isArray(order.items) ? (
                                  order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-850 shrink-0">
                                          <img
                                            src={item.image_url || "/batik-center.png"}
                                            alt={item.name}
                                            className="size-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = "/batik-center.png";
                                            }}
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 truncate">{item.name}</div>
                                          {item.selected_size && (
                                            <div className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">Ukuran: {item.selected_size}</div>
                                          )}
                                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                            Rp {Number(item.price).toLocaleString("id-ID")} x {item.quantity}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">Rp {Number(item.price * item.quantity).toLocaleString("id-ID")}</span>
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

                            {/* Tracking Timeline */}
                            {order.status !== "Dibatalkan" && (
                              <div className="py-4 border-y border-zinc-100 dark:border-zinc-850 my-2">
                                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <Truck className="size-3.5 text-indigo-500" /> Status Pengiriman
                                  </span>
                                  {shippingInfo.trackingNumber && (
                                    <span className="text-indigo-650 dark:text-indigo-400 font-black">
                                      {shippingInfo.courierName} ({shippingInfo.trackingNumber})
                                    </span>
                                  )}
                                </div>
                                
                                <div className="relative flex items-center justify-between w-full mt-4 px-4">
                                  {/* Background Track */}
                                  <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-200 dark:bg-zinc-850 z-0" />
                                  
                                  {/* Active Track Highlight */}
                                  <div 
                                    className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 transition-all duration-500 z-0" 
                                    style={{ 
                                      width: 
                                        shippingInfo.currentStep === 0 ? "0%" :
                                        shippingInfo.currentStep === 1 ? "33%" :
                                        shippingInfo.currentStep === 2 ? "66%" : "100%" 
                                    }} 
                                  />

                                  {/* Steps */}
                                  {[
                                    { label: "Dipesan" },
                                    { label: "Dikemas" },
                                    { label: "Dikirim" },
                                    { label: "Selesai" }
                                  ].map((step, stepIdx) => {
                                    const isActive = stepIdx <= shippingInfo.currentStep;
                                    const isCurrent = stepIdx === shippingInfo.currentStep;
                                    return (
                                      <div key={step.label} className="relative z-10 flex flex-col items-center">
                                        <div className={`size-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                          isCurrent 
                                            ? "bg-indigo-500 border-indigo-500 text-white scale-110 shadow-sm shadow-indigo-500/20" 
                                            : isActive 
                                            ? "bg-indigo-50 border-indigo-555 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800"
                                        }`}>
                                          {stepIdx === 0 && <ShoppingBag className="size-3.5" />}
                                          {stepIdx === 1 && <Clock className="size-3.5" />}
                                          {stepIdx === 2 && <Truck className="size-3.5" />}
                                          {stepIdx === 3 && <Check className="size-3.5" />}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase mt-2 tracking-wider ${
                                          isActive ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-650"
                                        }`}>
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Delivery details and bottom options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-850 pt-3">
                              <div className="space-y-0.5">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Alamat Pengiriman</h4>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-200 block">{order.customer_name} ({order.customer_phone})</span>
                                  {order.address}
                                </p>
                              </div>
                              <div className="flex flex-col items-start md:items-end justify-between gap-3.5 pt-2 md:pt-0">
                                <div className="md:text-right">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TOTAL PEMBAYARAN</span>
                                  <span className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-zinc-50">
                                    Rp {Number(order.total_amount).toLocaleString("id-ID")}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 justify-end w-full">
                                  {/* Unduh Resi PDF */}
                                  <Button
                                    variant="outline"
                                    onClick={() => handlePrintUserReceipt(order)}
                                    className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] rounded-full px-3.5 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                  >
                                    <Printer className="size-3.5" />
                                    <span>Unduh Resi PDF</span>
                                  </Button>

                                  {/* Quick Actions (Aksi Cepat) */}
                                  {order.status && order.status.startsWith("Dikirim") && (
                                    <>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setTrackingOrder(order);
                                          setIsTrackDialogOpen(true);
                                        }}
                                        className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] rounded-full px-3.5 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                                      >
                                        <Truck className="size-3.5" />
                                        <span>Lacak Resi</span>
                                      </Button>

                                      <Button
                                        onClick={() => handleConfirmReceived(order.id)}
                                        disabled={confirmingOrderId === order.id}
                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded-full px-3.5 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                      >
                                        {confirmingOrderId === order.id ? (
                                          <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                          <Check className="size-3.5" />
                                        )}
                                        <span>Diterima</span>
                                      </Button>
                                    </>
                                  )}

                                  {(order.status === "Selesai" || order.status === "Dibatalkan" || order.status === "Batal") && (
                                    <Button
                                      onClick={() => handleReorder(order)}
                                      className="h-8 bg-zinc-950 hover:bg-zinc-900 text-[#bef264] text-[10px] rounded-full px-4 font-black uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-[1.02] cursor-pointer"
                                    >
                                      <ShoppingBag className="size-3.5" />
                                      <span>Beli Lagi</span>
                                    </Button>
                                  )}

                                  {/* Receipt uploading/preview */}
                                  {order.receipt_url ? (
                                    <a
                                      href={order.receipt_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-850"
                                    >
                                      <ExternalLink className="size-3" />
                                      <span>Bukti Transfer</span>
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
                                    !order.status.startsWith("Dikirim") && order.status !== "Selesai" && (
                                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-full">
                                        <Clock className="size-3.5" />
                                        <span>Bayar di Tempat (COD)</span>
                                      </div>
                                    )
                                  )}
                                </div>
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
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Pengaturan Akun</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      Kelola informasi profil, kata sandi, dan buku alamat pengiriman Anda.
                    </p>
                  </div>
                  
                  {/* Segmented Sub-tabs */}
                  <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl self-start sm:self-auto border border-zinc-200/50 dark:border-zinc-850 shrink-0">
                    <button
                      type="button"
                      onClick={() => setProfileSubTab("info")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        profileSubTab === "info"
                          ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs"
                          : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      Data Diri
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileSubTab("password")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        profileSubTab === "password"
                          ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs"
                          : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      Keamanan
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileSubTab("addresses")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        profileSubTab === "addresses"
                          ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs"
                          : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      Buku Alamat
                    </button>
                  </div>
                </div>

                {/* Sub-tab Content: Info Data Diri */}
                {profileSubTab === "info" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Profile Avatar Selection & Custom Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                      <div className="relative group shrink-0">
                        <div className="size-20 rounded-full border border-zinc-250 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                              <User className="size-8" />
                            </div>
                          )}
                        </div>
                        {/* Custom File Upload Trigger */}
                        <label className="absolute -bottom-1.5 -right-1.5 bg-black hover:bg-zinc-900 text-white dark:bg-zinc-850 dark:hover:bg-zinc-750 size-7 rounded-full flex items-center justify-center border border-zinc-250 dark:border-zinc-700 cursor-pointer shadow-md transition-all active:scale-90">
                          <Camera className="size-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      <div className="flex-1 space-y-2.5 text-center sm:text-left">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Pilih Preset Foto Profil</span>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {PRESET_AVATARS.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setAvatarUrl(url);
                                if (user) {
                                  localStorage.setItem(`berakit_avatar_${user.id}`, url);
                                }
                                toast.success(`Preset Avatar #${i + 1} dipilih!`);
                              }}
                              className={`size-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                                avatarUrl === url ? "border-indigo-500 scale-105 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                              }`}
                            >
                              <img src={url} alt={`Preset Avatar ${i + 1}`} className="size-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Nama Lengkap</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                            <input
                              required
                              type="text"
                              value={fullNameInput}
                              onChange={(e) => setFullNameInput(e.target.value)}
                              placeholder="Nama Lengkap Anda"
                              className="w-full h-11 pl-11 pr-4 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-450 transition-all font-semibold"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Nomor HP / WhatsApp</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                            <input
                              required
                              type="tel"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="Contoh: 0812345678"
                              className="w-full h-11 pl-11 pr-4 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-450 transition-all font-semibold"
                            />
                          </div>
                        </div>

                        {/* Email (Read-Only) */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Email (Akun Utama)</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                            <input
                              disabled
                              type="email"
                              value={user?.email || ""}
                              className="w-full h-11 pl-11 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/60 text-sm text-zinc-400 cursor-not-allowed font-semibold"
                            />
                          </div>
                          <span className="text-[9px] text-zinc-400 font-medium block">Email terhubung dengan autentikasi utama dan tidak dapat diubah.</span>
                        </div>
                      </div>

                      {/* Main Address */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Alamat Utama Pengiriman</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 size-4 text-zinc-400" />
                          <textarea
                            required
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            placeholder="Tulis alamat rumah lengkap (RT/RW, Dusun, Desa, Kecamatan, Kabupaten, Kodepos)"
                            rows={3}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-450 transition-all font-semibold resize-none"
                          />
                        </div>
                      </div>

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

                {/* Sub-tab Content: Security / Password */}
                {profileSubTab === "password" && (
                  <form onSubmit={handleChangePassword} className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ganti Kata Sandi</h4>
                      <p className="text-xs text-zinc-555 dark:text-zinc-450 font-medium mt-0.5">Masukkan kata sandi baru Anda. Pastikan minimal 6 karakter demi keamanan akun.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Kata Sandi Baru</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                          <input
                            required
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full h-11 pl-11 pr-4 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-450 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                          <input
                            required
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi kata sandi baru"
                            className="w-full h-11 pl-11 pr-4 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-450 transition-all font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="h-10 bg-black hover:bg-zinc-900 text-white dark:bg-zinc-950 dark:hover:bg-zinc-900 rounded-lg px-6 text-xs font-extrabold uppercase tracking-widest gap-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-[#bef264]" />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <span>Ganti Kata Sandi</span>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Sub-tab Content: Address Book */}
                {profileSubTab === "addresses" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Buku Alamat</h4>
                        <p className="text-xs text-zinc-555 dark:text-zinc-450 font-medium mt-0.5">Kelola daftar alamat pengiriman agar checkout lebih cepat.</p>
                      </div>
                      
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressLabel("Rumah");
                          setRecipientName(fullNameInput);
                          setRecipientPhone(phoneInput);
                          setAddressLine(addressInput);
                          setIsAddressPrimary(addresses.length === 0);
                          setIsAddressDialogOpen(true);
                        }}
                        className="h-9 bg-black hover:bg-zinc-900 text-white dark:bg-zinc-950 dark:hover:bg-zinc-900 rounded-xl px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        <span>Tambah Alamat</span>
                      </Button>
                    </div>

                    {/* Address List Cards */}
                    {addresses.length === 0 ? (
                      <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <MapPin className="size-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5" />
                        <p className="text-xs text-zinc-500 font-semibold">Belum ada alamat tersimpan di Buku Alamat.</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Tambahkan alamat rumah atau kantor Anda untuk kemudahan checkout.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div 
                            key={addr.id} 
                            className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                              addr.is_primary 
                                ? "bg-indigo-50/20 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900" 
                                : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-zinc-350"
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Label & Tags */}
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                  addr.label === "Rumah"
                                    ? "bg-zinc-100 border-zinc-250 text-zinc-700 dark:bg-zinc-850 dark:border-zinc-750 dark:text-zinc-300"
                                    : addr.label === "Kantor"
                                    ? "bg-amber-50 border-amber-250 text-amber-700 dark:bg-amber-950/15 dark:border-amber-900/60 dark:text-amber-400"
                                    : "bg-purple-50 border-purple-250 text-purple-700 dark:bg-purple-950/15 dark:border-purple-900/60 dark:text-purple-400"
                                }`}>
                                  {addr.label}
                                </span>
                                {addr.is_primary && (
                                  <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500 border border-indigo-500 text-white">
                                    Alamat Utama
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50">{addr.recipient_name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono font-semibold">{addr.recipient_phone}</div>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed break-words font-medium">
                                  {addr.address_line}
                                </p>
                              </div>
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
                              {!addr.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryAddress(addr)}
                                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline transition-all cursor-pointer border-none bg-transparent"
                                >
                                  Jadikan Utama
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAddress(addr);
                                  setAddressLabel(addr.label);
                                  setRecipientName(addr.recipient_name);
                                  setRecipientPhone(addr.recipient_phone);
                                  setAddressLine(addr.address_line);
                                  setIsAddressPrimary(addr.is_primary);
                                  setIsAddressDialogOpen(true);
                                }}
                                className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none bg-transparent"
                              >
                                <Edit className="size-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
                                    handleDeleteAddress(addr.id);
                                  }
                                }}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none bg-transparent"
                              >
                                <Trash className="size-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: SUPPORT ── */}
            {activeTab === "support" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {/* Tiket Komplain Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Kirim Tiket Komplain</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        Laporkan barang rusak, salah kirim, atau kendala pengiriman lainnya.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitComplaint} className="space-y-4">
                      {/* Pilih Transaksi */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Pilih Transaksi / Pesanan</label>
                        <select
                          required
                          value={complaintOrderId}
                          onChange={(e) => setComplaintOrderId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
                        >
                          <option value="">-- Pilih ID Pesanan --</option>
                          {orders.map((o) => (
                            <option key={o.id} value={o.id}>
                              Order #{o.id.substring(0, 8)}... - Rp {Number(o.total_amount).toLocaleString("id-ID")} ({o.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Jenis Masalah */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Jenis Masalah</label>
                          <select
                            value={complaintType}
                            onChange={(e) => setComplaintType(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
                          >
                            <option value="Barang Rusak / Cacat">Barang Rusak / Cacat</option>
                            <option value="Salah Kirim Barang">Salah Kirim Barang</option>
                            <option value="Paket Kurang / Hilang">Paket Kurang / Hilang</option>
                            <option value="Keterlambatan Pengiriman">Keterlambatan Pengiriman</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>

                        {/* Upload Bukti Gambar */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Unggah Foto Bukti</label>
                          <div className="flex gap-2">
                            <label className="h-10 flex-1 flex items-center justify-center border border-zinc-250 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 cursor-pointer transition-all gap-1.5 text-xs font-semibold">
                              <Camera className="size-4" />
                              <span>{isUploadingComplaintProof ? "Mengunggah..." : "Pilih Foto / Gambar"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleComplaintProofUpload}
                                className="hidden"
                                disabled={isUploadingComplaintProof}
                              />
                            </label>
                            {complaintProofUrl && (
                              <div className="size-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                                <img src={complaintProofUrl} alt="Preview Bukti" className="size-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rincian Komplain */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Rincian Deskripsi Komplain</label>
                        <textarea
                          required
                          value={complaintDescription}
                          onChange={(e) => setComplaintDescription(e.target.value)}
                          placeholder="Jelaskan secara rinci kondisi produk, kerusakan, atau masalah yang Anda alami..."
                          rows={4}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-all font-semibold resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingComplaint || isUploadingComplaintProof}
                        className="w-full h-10 bg-black dark:bg-zinc-950 text-white hover:bg-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
                      >
                        {isSubmittingComplaint ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Mengirim Tiket...</span>
                          </>
                        ) : (
                          <span>Kirim Tiket Komplain</span>
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* History of tickets list */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-7 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Riwayat Tiket Komplain</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        Pantau status penanganan komplain Anda oleh pihak BUMDes.
                      </p>
                    </div>

                    {complaints.length === 0 ? (
                      <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <Mail className="size-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500 font-semibold">Belum ada tiket komplain aktif.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {complaints.map((ticket) => (
                          <div key={ticket.id} className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-left space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-mono text-[10px] bg-zinc-200 dark:bg-zinc-850 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-bold uppercase">{ticket.id}</span>
                                <span className="text-[10px] text-zinc-400 ml-2">{new Date(ticket.created_at).toLocaleDateString("id-ID")}</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                ticket.status === "Selesai" 
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : ticket.status === "Diproses"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>

                            <div className="text-xs space-y-1">
                              <div>
                                <span className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider block">ID Transaksi / Jenis Masalah</span>
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Order #{ticket.order_id.substring(0, 8)}... - <span className="text-indigo-500">{ticket.type}</span></span>
                              </div>
                              <div>
                                <span className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider block">Deskripsi Masalah</span>
                                <p className="text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed">{ticket.description}</p>
                              </div>
                              {ticket.proof_url && (
                                <div className="pt-1.5">
                                  <span className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider block mb-1">Foto Bukti</span>
                                  <a href={ticket.proof_url} target="_blank" rel="noreferrer" className="inline-block size-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs hover:opacity-90">
                                    <img src={ticket.proof_url} alt="Bukti Komplain" className="size-full object-cover" />
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Admin Response Card */}
                            {ticket.admin_response ? (
                              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg text-xs space-y-1">
                                <span className="text-indigo-500 font-black uppercase text-[9px] tracking-wider block">Tanggapan Admin</span>
                                <p className="text-zinc-750 dark:text-zinc-300 font-semibold">{ticket.admin_response}</p>
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-400 font-semibold italic flex items-center gap-1">
                                <Clock className="size-3" />
                                <span>Menunggu tanggapan dari tim Admin BUMDes...</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* FAQ & Quick Chat Contacts */}
                <div className="space-y-6">
                  {/* WhatsApp Hubungi Admin Card */}
                  <div className="bg-linear-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-5 sm:p-6 shadow-md relative overflow-hidden text-left space-y-4">
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 size-32 rounded-full border-4 border-white" />
                    
                    <div className="space-y-1.5 relative z-10">
                      <div className="bg-white/20 size-8 rounded-lg flex items-center justify-center mb-1">
                        <Phone className="size-4 text-white" />
                      </div>
                      <h4 className="font-black text-sm uppercase tracking-wider">Layanan Chat Admin</h4>
                      <p className="text-xs text-emerald-50/90 leading-relaxed font-semibold">
                        Hubungi tim admin BUMDes Berakit secara langsung melalui WhatsApp untuk respon cepat 24/7.
                      </p>
                    </div>

                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20BUMDes%20Berakit%20saya%20butuh%20bantuan%20dengan%20pesanan%20saya..."
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-9 bg-white text-emerald-600 hover:bg-emerald-50 active:scale-98 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Hubungi via WhatsApp</span>
                    </a>
                  </div>

                  {/* FAQ Accordion Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xs text-left space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50">FAQ / Pertanyaan Umum</h4>
                    
                    <div className="space-y-3.5">
                      <div className="space-y-1 border-b pb-3 dark:border-zinc-850">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Bagaimana cara melacak pesanan saya?</span>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          Anda dapat melihat status perjalanan kurir secara real-time pada tab <strong className="text-zinc-650 dark:text-zinc-400">Pesanan Saya</strong> dan klik tombol <strong className="text-zinc-650 dark:text-zinc-400">Lacak</strong>.
                        </p>
                      </div>

                      <div className="space-y-1 border-b pb-3 dark:border-zinc-850">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Berapa lama proses pembuatan batik?</span>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          Proses pembuatan batik tulis khas Berakit membutuhkan waktu 7-14 hari kerja tergantung pada kerumitan motif.
                        </p>
                      </div>

                      <div className="space-y-1 border-b pb-3 dark:border-zinc-850">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Apakah pesanan bisa dibatalkan?</span>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          Pembatalan hanya bisa dilakukan sebelum pesanan masuk ke status "Dikemas" atau "Diproses" oleh admin BUMDes.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Bagaimana syarat retur barang?</span>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          Anda harus menyertakan video unboxing utuh tanpa terputus dan mengunggahnya pada form Tiket Komplain di halaman ini.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Address Dialog (Add/Edit) */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="max-w-[420px] border-border/85 bg-white dark:bg-zinc-950 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <MapPin className="size-4.5 text-indigo-500" />
              {editingAddress ? "Edit Alamat Pengiriman" : "Tambah Alamat Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-450 dark:text-zinc-500 pt-1">
              Simpan data alamat pengiriman dengan lengkap untuk mempermudah transaksi belanja Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAddress} className="space-y-4 py-3 text-left">
            {/* Label Alamat */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Label Alamat</label>
              <div className="grid grid-cols-3 gap-2">
                {["Rumah", "Kantor", "Kost"].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setAddressLabel(lbl)}
                    className={`py-2 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                      addressLabel === lbl
                        ? "bg-zinc-950 border-zinc-950 text-white shadow-xs dark:bg-white dark:border-white dark:text-black"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Nama Penerima */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Nama Penerima</label>
              <input
                required
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nama lengkap penerima paket"
                className="w-full h-10 px-3.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
              />
            </div>

            {/* Telepon Penerima */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">No. Telepon / WhatsApp</label>
              <input
                required
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Contoh: 0812345678"
                className="w-full h-10 px-3.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:outline-none focus:border-zinc-400 transition-all font-semibold"
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Alamat Lengkap</label>
              <textarea
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Tulis nama jalan, RT/RW, kelurahan, kecamatan, kabupaten, kode pos"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:outline-none focus:border-zinc-400 transition-all font-semibold resize-none"
              />
            </div>

            {/* Checkbox Set Primary */}
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="checkbox"
                id="is_primary"
                checked={isAddressPrimary}
                onChange={(e) => setIsAddressPrimary(e.target.checked)}
                disabled={!editingAddress && addresses.length === 0}
                className="rounded border-zinc-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="is_primary" className="text-[11px] font-bold text-zinc-650 dark:text-zinc-400 uppercase tracking-wider cursor-pointer">
                Jadikan Alamat Utama Pengiriman
              </label>
            </div>

            <DialogFooter className="pt-3 border-t mt-1 gap-2 sm:gap-0">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAddressDialogOpen(false)}
                className="h-9 text-xs font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-full cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-9 text-xs font-black uppercase tracking-wider bg-black dark:bg-zinc-900 text-white hover:opacity-90 rounded-full cursor-pointer"
              >
                Simpan Alamat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tracking Details Modal */}
      <Dialog open={isTrackDialogOpen} onOpenChange={setIsTrackDialogOpen}>
        <DialogContent className="max-w-[420px] border-border/85 bg-white dark:bg-zinc-950 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <Truck className="size-4.5 text-indigo-500" />
              Lacak Pengiriman Pesanan
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 pt-1">
              Rincian perjalanan kurir untuk transaksi <strong className="font-mono text-zinc-800 dark:text-zinc-200">{trackingOrder?.id}</strong>.
            </DialogDescription>
          </DialogHeader>

          {trackingOrder && (
            (() => {
              const info = getOrderStep(trackingOrder.status);
              return (
                <div className="space-y-5 py-3 text-left">
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-3.5 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Kurir Pengiriman:</span>
                      <span className="font-black text-indigo-650 dark:text-indigo-400">{info.courierName || "Kurir Partner"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Nomor Resi:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-150">{info.trackingNumber || "-"}</span>
                    </div>
                  </div>

                  <div className="relative pl-6 border-l border-indigo-200 dark:border-indigo-900/60 space-y-5 text-xs ml-2">
                    {/* Step 3: Selesai */}
                    <div className={`relative ${info.currentStep >= 3 ? "opacity-100" : "opacity-40 transition-opacity"}`}>
                      <div className={`absolute -left-[29px] top-0 size-3.5 rounded-full border-2 flex items-center justify-center ${
                        info.currentStep >= 3 ? "bg-indigo-500 border-indigo-500" : "bg-white border-zinc-300 dark:bg-zinc-950"
                      }`}>
                        {info.currentStep >= 3 && <div className="size-1 bg-white rounded-full" />}
                      </div>
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">Pesanan Diterima / Selesai</div>
                      <p className="text-zinc-550 dark:text-zinc-450 mt-1 leading-normal">
                        Paket telah sampai di tujuan dan diterima dengan baik oleh pembeli. Terima kasih telah berbelanja!
                      </p>
                    </div>

                    {/* Step 2: Dikirim */}
                    <div className={`relative ${info.currentStep >= 2 ? "opacity-100" : "opacity-40 transition-opacity"}`}>
                      <div className={`absolute -left-[29px] top-0 size-3.5 rounded-full border-2 flex items-center justify-center ${
                        info.currentStep >= 2 ? "bg-indigo-500 border-indigo-500" : "bg-white border-zinc-300 dark:bg-zinc-950"
                      }`}>
                        {info.currentStep >= 2 && <div className="size-1 bg-white rounded-full" />}
                      </div>
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">Paket Sedang Dikirim</div>
                      <p className="text-zinc-550 dark:text-zinc-450 mt-1 leading-normal">
                        Kurir {info.courierName || "J&T"} sedang mengantarkan paket ke alamat tujuan Anda dengan nomor resi <strong className="font-mono text-zinc-800 dark:text-zinc-200">{info.trackingNumber}</strong>.
                      </p>
                    </div>

                    {/* Step 1: Dikemas */}
                    <div className={`relative ${info.currentStep >= 1 ? "opacity-100" : "opacity-40 transition-opacity"}`}>
                      <div className={`absolute -left-[29px] top-0 size-3.5 rounded-full border-2 flex items-center justify-center ${
                        info.currentStep >= 1 ? "bg-indigo-500 border-indigo-500" : "bg-white border-zinc-300 dark:bg-zinc-950"
                      }`}>
                        {info.currentStep >= 1 && <div className="size-1 bg-white rounded-full" />}
                      </div>
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">Pesanan Diproses / Dikemas</div>
                      <p className="text-zinc-550 dark:text-zinc-450 mt-1 leading-normal">
                        Pesanan Anda sedang disiapkan dan dikemas rapi oleh admin BUMDes Berakit.
                      </p>
                    </div>

                    {/* Step 0: Dipesan */}
                    <div className="relative">
                      <div className="absolute -left-[29px] top-0 size-3.5 rounded-full border-2 bg-indigo-500 border-indigo-500 flex items-center justify-center">
                        <div className="size-1 bg-white rounded-full" />
                      </div>
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[10px]">Pesanan Berhasil Dibuat</div>
                      <p className="text-zinc-550 dark:text-zinc-450 mt-1 leading-normal">
                        Transaksi pembelian Anda telah berhasil tercatat di sistem kami dan sedang menunggu verifikasi pembayaran.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          <DialogFooter className="pt-3 border-t mt-1">
            <Button
              type="button"
              onClick={() => setIsTrackDialogOpen(false)}
              className="h-9 text-xs font-bold uppercase tracking-wider bg-black dark:bg-zinc-900 text-white hover:opacity-90 rounded-full w-full cursor-pointer"
            >
              Tutup Rincian Lacak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
