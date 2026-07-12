"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  PackageX,
  AlertTriangle,
  UploadCloud,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { supabase, withTimeout, handleSupabaseError } from "@/lib/supabase";
import { addActivityLog } from "@/lib/logger";
import { LoadingLottie } from "@/components/ui/loading-lottie";
import { toast } from "sonner";

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  created_at?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Proses Canting Batik Pesisir",
    description: "Perajin lokal menggambar motif biota laut menggunakan lilin malam panas secara teliti di Desa Berakit.",
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80",
    category: "Proses Pembuatan",
  },
  {
    id: "gal-2",
    title: "Pewarnaan Kain Batik",
    description: "Kain batik dicelupkan ke dalam larutan pewarna alami dari tanaman sekitar pesisir Desa Berakit.",
    image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=800&auto=format&fit=crop&q=80",
    category: "Proses Pembuatan",
  },
  {
    id: "gal-3",
    title: "Koleksi Selendang Sutra",
    description: "Keindahan motif ombak samudra pada kain sutra premium hasil karya kelompok perajin batik Berakit.",
    image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80",
    category: "Produk",
  },
  {
    id: "gal-4",
    title: "Pameran Batik Khas Bintan",
    description: "Partisipasi BUMDes Berakit dalam memamerkan produk batik khas di acara festival pariwisata daerah.",
    image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    category: "Acara",
  }
];

const categories = ["Proses Pembuatan", "Produk", "Acara", "Komunitas"];

import { useDashboardStore } from "@/store/dashboard-store";

export function GalleryCrud() {
  const [gallery, setGallery] = React.useState<GalleryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showSpinner, setShowSpinner] = React.useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(!!supabase);
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);
  const highlightItemId = useDashboardStore((state) => state.highlightItemId);
  const setHighlightItemId = useDashboardStore((state) => state.setHighlightItemId);
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  // Form Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<GalleryItem | null>(null);
  const [formTitle, setFormTitle] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formCategory, setFormCategory] = React.useState("Proses Pembuatan");
  const [formImageUrl, setFormImageUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // File Upload States
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [showUrlField, setShowUrlField] = React.useState(false);

  // Drag and Drop States
  const [isDragging, setIsDragging] = React.useState(false);

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingItem, setDeletingItem] = React.useState<GalleryItem | null>(null);

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);

  // Check Supabase status & fetch data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;

    if (hasCredentials) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("gallery")
            .select("*")
            .order("created_at", { ascending: false })
        );

        if (error) throw error;

        setGallery(data || []);
        setIsUsingSupabase(true);
      } catch (err: any) {
        handleSupabaseError("GalleryCrud.loadData", err);
        toast.error("Gagal memuat data dari Supabase. Periksa koneksi atau skema database.");
        setGallery([]);
        setIsUsingSupabase(false);
      }
    } else {
      setIsUsingSupabase(false);
      setGallery([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (highlightItemId && gallery.length > 0) {
      const exists = gallery.some((g) => g.id === highlightItemId);
      if (exists) {
        const timer = setTimeout(() => {
          const el = document.getElementById(`gallery-${highlightItemId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            const clearTimer = setTimeout(() => {
              setHighlightItemId(null);
            }, 4000);
            return () => clearTimeout(clearTimer);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightItemId, gallery, setHighlightItemId]);

  // Open Form for Add
  const handleAddClick = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Proses Pembuatan");
    setFormImageUrl("");
    setUploadFile(null);
    setImagePreview("");
    setShowUrlField(false);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleEditClick = (item: GalleryItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormCategory(item.category || "Proses Pembuatan");
    setFormImageUrl(item.image_url || "");
    setUploadFile(null);
    setImagePreview(item.image_url || "");
    setShowUrlField(false);
    setIsFormOpen(true);
  };

  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
      }
      setUploadFile(file);
      try {
        const previewUrl = await fileToBase64(file);
        setImagePreview(previewUrl);
        setFormImageUrl(""); // Clear URL input if file is uploaded
      } catch (err) {
        console.error("Preview generation failed", err);
      }
    }
  };

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Hanya file gambar yang diperbolehkan.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
      }
      setUploadFile(file);
      try {
        const previewUrl = await fileToBase64(file);
        setImagePreview(previewUrl);
        setFormImageUrl(""); // Clear URL input if file is uploaded
      } catch (err) {
        console.error("Preview generation failed", err);
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setUploadFile(null);
    setImagePreview("");
    setFormImageUrl("");
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSubmitting(true);
    let finalImageUrl = formImageUrl || imagePreview || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60";

    // Handle file upload
    if (uploadFile) {
      try {
        // Try uploading to Supabase Storage in "gallery" bucket
        if (isUsingSupabase && supabase) {
          const fileExt = uploadFile.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("gallery")
            .upload(filePath, uploadFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.warn("Supabase storage upload failed, falling back to base64 encoding:", uploadError);
            const base64Url = await fileToBase64(uploadFile);
            finalImageUrl = base64Url;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from("gallery")
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } else {
          // If offline or local storage, use base64
          const base64Url = await fileToBase64(uploadFile);
          finalImageUrl = base64Url;
        }
      } catch (err) {
        console.warn("Storage upload exception, falling back to base64:", err);
        const base64Url = await fileToBase64(uploadFile);
        finalImageUrl = base64Url;
      }
    }

    const newGalleryData = {
      title: formTitle,
      description: formDescription,
      category: formCategory,
      image_url: finalImageUrl,
    };

    if (isUsingSupabase && supabase) {
      try {
        if (editingItem) {
          // Update Supabase
          const { data, error } = await supabase
            .from("gallery")
            .update(newGalleryData)
            .eq("id", editingItem.id)
            .select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Kebijakan keamanan RLS memblokir aksi edit.");
          }
          addActivityLog(
            "Edit Galeri",
            `Mengubah foto galeri '${newGalleryData.title}' (Supabase)`,
            "gallery"
          );
          toast.success(`Foto '${newGalleryData.title}' berhasil diperbarui.`);
        } else {
          // Insert Supabase
          const { data, error } = await supabase
            .from("gallery")
            .insert([newGalleryData])
            .select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Kebijakan keamanan RLS memblokir aksi tambah.");
          }
          addActivityLog(
            "Tambah Galeri",
            `Menambahkan foto galeri baru '${newGalleryData.title}' (Supabase)`,
            "gallery"
          );
          toast.success(`Foto baru '${newGalleryData.title}' berhasil ditambahkan.`);
        }
        await loadData();
        setIsFormOpen(false);
      } catch (err: any) {
        toast.error(`Gagal menyimpan ke Supabase: ${err.message || err}`);
        console.error(err);
      }
    } else {
      toast.error("Supabase belum terkonfigurasi di file env.");
    }
    setSubmitting(false);
  };

  // Open Delete Confirmation
  const handleDeleteClick = (item: GalleryItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setSubmitting(true);
    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from("gallery")
          .delete()
          .eq("id", deletingItem.id)
          .select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Kebijakan keamanan RLS memblokir aksi hapus.");
        }

        addActivityLog(
          "Hapus Galeri",
          `Menghapus foto galeri '${deletingItem.title}' (Supabase)`,
          "gallery"
        );
        toast.success("Foto galeri berhasil dihapus.");
        await loadData();
        setIsDeleteOpen(false);
      } catch (err: any) {
        toast.error(`Gagal menghapus dari Supabase: ${err.message || err}`);
      }
    } else {
      toast.error("Supabase belum terkonfigurasi di file env.");
    }
    setSubmitting(false);
  };

  // Search and Filter Logic
  const filteredGallery = React.useMemo(() => {
    return gallery.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [gallery, searchQuery, categoryFilter]);

  return (
    <div className="space-y-4">
      {/* Supabase Status Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${isUsingSupabase ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-bounce"}`} />
          <span className="font-medium">
            {isUsingSupabase ? "Koneksi Database: Tersambung ke Supabase Cloud (Live)" : "Koneksi Database: Terputus / Belum Dikonfigurasi"}
          </span>
        </div>
        {!isUsingSupabase && (
          <span className="text-[10px] text-rose-600 font-semibold hidden sm:inline">
            Wajib mengkonfigurasi berkas .env untuk mengaktifkan CRUD Galeri
          </span>
        )}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold sm:text-xl flex items-center gap-2">
              <ImageIcon className="size-5 text-primary" />
              Galeri Kegiatan Desa
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Kelola arsip dokumentasi penjualan, kegiatan perajin, dan acara kebudayaan Desa Berakit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari foto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 sm:h-9"
              />
            </div>

            {/* Filter Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 sm:h-9 w-full sm:w-44">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Gallery Button */}
            <Button size="sm" onClick={handleAddClick} className="h-8 sm:h-9 gap-1 shrink-0">
              <Plus className="size-4" />
              Tambah Foto
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto p-2 sm:p-4">
          {showSpinner ? (
            <LoadingLottie size={100} label="Memuat arsip galeri..." />
          ) : loading ? (
            <div className="h-[200px]" />
          ) : filteredGallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center animate-in fade-in duration-300">
              <PackageX className="size-12 text-muted-foreground/60" />
              <div>
                <h3 className="font-semibold text-sm">Tidak ada dokumentasi ditemukan</h3>
                <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan pencarian atau tambahkan dokumentasi foto baru.</p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Judul Dokumentasi</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="hidden sm:table-cell">Deskripsi</TableHead>
                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGallery.map((item) => (
                    <TableRow
                      key={item.id}
                      id={`gallery-${item.id}`}
                      className={highlightItemId === item.id ? "item-highlight transition-all duration-500" : "transition-all duration-300"}
                    >
                      <TableCell>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="size-12 object-cover rounded-md border"
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="font-medium text-sm block truncate">{item.title}</span>
                        <span className="text-[11px] text-muted-foreground block truncate md:hidden">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="font-normal text-[11px]">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[300px]">
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditClick(item)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Gallery Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Dokumentasi Galeri" : "Tambah Foto Baru ke Galeri"}</DialogTitle>
              <DialogDescription>
                Lengkapi detail foto arsip kegiatan atau produk Desa Berakit di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Title */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Judul Foto *</label>
                <Input
                  required
                  placeholder="Misal: Kunjungan Wisatawan Mancanegara"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Kategori Galeri *</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Foto Uploader */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold">Foto Dokumentasi</label>
                
                {imagePreview ? (
                  <div 
                    className="relative group rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {isDragging ? (
                      <div className="absolute inset-0 bg-primary/25 backdrop-blur-xs flex items-center justify-center border-2 border-dashed border-primary">
                        <span className="text-xs font-bold text-white bg-primary px-2.5 py-1 rounded-md shadow-lg animate-bounce">
                          Lepaskan Foto Baru
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => document.getElementById("gallery-file-upload")?.click()}
                        >
                          Ganti Foto
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={handleRemoveImage}
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById("gallery-file-upload")?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                      <UploadCloud className="size-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-primary hover:underline">
                        {isDragging ? "Lepaskan untuk mengunggah" : "Klik atau seret file ke sini"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, JPEG (Maks. 2MB)</p>
                    </div>
                  </div>
                )}
                
                <input
                  id="gallery-file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Optional URL Toggle */}
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setShowUrlField(!showUrlField)}
                  >
                    {showUrlField ? "Sembunyikan Input URL" : "Atau masukkan URL gambar secara manual"}
                  </button>
                </div>

                {showUrlField && (
                  <div className="grid gap-1.5 mt-2 transition-all">
                    <Input
                      placeholder="https://example.com/gambar.jpg"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                        setUploadFile(null); // Clear file upload if URL is edited
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Tempel URL gambar langsung (Unsplash, Imgur, dll.)
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Deskripsi / Keterangan</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Cerita atau deskripsi singkat di balik foto ini..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                {editingItem ? "Simpan Perubahan" : "Simpan Dokumentasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center">Hapus Dokumentasi?</DialogTitle>
            <DialogDescription className="text-center">
              Tindakan ini tidak dapat dibatalkan. Foto <strong>{deletingItem?.title}</strong> akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
