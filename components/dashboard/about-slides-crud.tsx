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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  PackageX,
  AlertTriangle,
  UploadCloud,
  X,
  Sliders,
} from "lucide-react";
import { supabase, withTimeout, handleSupabaseError } from "@/lib/supabase";
import { addActivityLog } from "@/lib/logger";
import { LoadingLottie } from "@/components/ui/loading-lottie";
import { toast } from "sonner";

interface AboutSlide {
  id: string;
  title: string;
  caption: string;
  image_url: string;
  order_index?: number;
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

const DEFAULT_SLIDES: AboutSlide[] = [
  {
    id: "slide-1",
    title: "CRAFTED BY NATURE",
    caption: "Bringing the timeless coastal heritage of Berakit Village to the forefront of contemporary digital lifestyle.",
    image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=1600&auto=format&fit=crop&q=80",
    order_index: 1,
  },
  {
    id: "slide-2",
    title: "TRADITIONAL CANTING ART",
    caption: "Meticulously hand-drawn with hot wax by local women artisans, preserving centuries-old wisdom.",
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1600&auto=format&fit=crop&q=80",
    order_index: 2,
  },
  {
    id: "slide-3",
    title: "COMMUNITY EMPOWERMENT",
    caption: "Supporting local cooperatives and establishing sustainable creative careers on the shores of Bintan.",
    image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1600&auto=format&fit=crop&q=80",
    order_index: 3,
  }
];

export function AboutSlidesCrud() {
  const [slides, setSlides] = React.useState<AboutSlide[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(!!supabase);

  // Form Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<AboutSlide | null>(null);
  const [formTitle, setFormTitle] = React.useState("");
  const [formCaption, setFormCaption] = React.useState("");
  const [formImageUrl, setFormImageUrl] = React.useState("");
  const [formOrderIndex, setFormOrderIndex] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  // File Upload States
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");
  const [showUrlField, setShowUrlField] = React.useState(false);

  // Drag and Drop States
  const [isDragging, setIsDragging] = React.useState(false);

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingItem, setDeletingItem] = React.useState<AboutSlide | null>(null);

  // Check Supabase status & fetch data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    const hasCredentials = !!supabase;

    // Load from cache first
    const cached = localStorage.getItem("berakit_about_slides_cache");
    if (cached) {
      try {
        setSlides(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached about slides:", e);
      }
    } else {
      setSlides(DEFAULT_SLIDES);
      localStorage.setItem("berakit_about_slides_cache", JSON.stringify(DEFAULT_SLIDES));
    }

    if (hasCredentials) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("about_slides")
            .select("*")
            .order("order_index", { ascending: true })
        );

        if (error) throw error;

        if (data && data.length > 0) {
          setSlides(data);
          localStorage.setItem("berakit_about_slides_cache", JSON.stringify(data));
        } else if (data && data.length === 0) {
          // If table is empty but exists, insert default slides
          const { error: insertError } = await supabase
            .from("about_slides")
            .insert(DEFAULT_SLIDES.map(({ id, ...rest }) => rest)); // strip temp string ids
          if (!insertError) {
            const { data: refetched } = await supabase
              .from("about_slides")
              .select("*")
              .order("order_index", { ascending: true });
            if (refetched) {
              setSlides(refetched);
              localStorage.setItem("berakit_about_slides_cache", JSON.stringify(refetched));
            }
          }
        }
        setIsUsingSupabase(true);
      } catch (err: any) {
        handleSupabaseError("AboutSlidesCrud.loadData", err);
        console.warn("Falling back to local storage cache for about slides.");
        setIsUsingSupabase(false);
      }
    } else {
      setIsUsingSupabase(false);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Form for Add
  const handleAddClick = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCaption("");
    setFormImageUrl("");
    setFormOrderIndex(slides.length + 1);
    setUploadFile(null);
    setImagePreview("");
    setShowUrlField(false);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleEditClick = (item: AboutSlide) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCaption(item.caption || "");
    setFormImageUrl(item.image_url || "");
    setFormOrderIndex(item.order_index || 0);
    setUploadFile(null);
    setImagePreview(item.image_url || "");
    setShowUrlField(false);
    setIsFormOpen(true);
  };

  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 3MB.");
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
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 3MB.");
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
    let finalImageUrl = formImageUrl || imagePreview || "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500";

    // Handle file upload
    if (uploadFile) {
      try {
        if (isUsingSupabase && supabase) {
          const fileExt = uploadFile.name.split(".").pop();
          const fileName = `slide_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("gallery") // re-use gallery bucket
            .upload(filePath, uploadFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.warn("Storage upload failed, falling back to base64:", uploadError);
            const base64Url = await fileToBase64(uploadFile);
            finalImageUrl = base64Url;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from("gallery")
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } else {
          const base64Url = await fileToBase64(uploadFile);
          finalImageUrl = base64Url;
        }
      } catch (err) {
        console.warn("Storage upload error, using base64 fallback:", err);
        const base64Url = await fileToBase64(uploadFile);
        finalImageUrl = base64Url;
      }
    }

    const slideData: Omit<AboutSlide, "id"> & { order_index: number } = {
      title: formTitle,
      caption: formCaption,
      image_url: finalImageUrl,
      order_index: Number(formOrderIndex),
    };

    if (isUsingSupabase && supabase) {
      try {
        if (editingItem) {
          // Update Supabase
          const { data, error } = await supabase
            .from("about_slides")
            .update(slideData)
            .eq("id", editingItem.id)
            .select();

          if (error) throw error;

          addActivityLog(
            "Edit Slide About",
            `Mengubah banner slide '${slideData.title}'`,
            "settings"
          );
          toast.success(`Slide '${slideData.title}' berhasil diperbarui.`);
        } else {
          // Insert Supabase
          const { data, error } = await supabase
            .from("about_slides")
            .insert([slideData])
            .select();

          if (error) throw error;

          addActivityLog(
            "Tambah Slide About",
            `Menambahkan banner slide baru '${slideData.title}'`,
            "settings"
          );
          toast.success(`Slide baru '${slideData.title}' berhasil ditambahkan.`);
        }
        await loadData();
        setIsFormOpen(false);
      } catch (err: any) {
        toast.error(`Gagal menyimpan ke database: ${err.message || err}`);
      }
    } else {
      // Local Storage Fallback
      let updatedSlides = [...slides];
      if (editingItem) {
        updatedSlides = updatedSlides.map((s) =>
          s.id === editingItem.id ? { ...s, ...slideData } : s
        );
        toast.success(`Slide '${slideData.title}' diperbarui secara lokal.`);
      } else {
        const newSlide = {
          id: `local-slide-${Date.now()}`,
          ...slideData,
        };
        updatedSlides.push(newSlide);
        toast.success(`Slide baru '${slideData.title}' ditambahkan secara lokal.`);
      }
      // Sort local slides by order_index
      updatedSlides.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setSlides(updatedSlides);
      localStorage.setItem("berakit_about_slides_cache", JSON.stringify(updatedSlides));
      setIsFormOpen(false);
    }
    setSubmitting(false);
  };

  // Open Delete Confirmation
  const handleDeleteClick = (item: AboutSlide) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setSubmitting(true);
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase
          .from("about_slides")
          .delete()
          .eq("id", deletingItem.id);

        if (error) throw error;

        addActivityLog(
          "Hapus Slide About",
          `Menghapus slide banner '${deletingItem.title}'`,
          "settings"
        );
        toast.success("Slide banner berhasil dihapus.");
        await loadData();
        setIsDeleteOpen(false);
      } catch (err: any) {
        toast.error(`Gagal menghapus slide: ${err.message || err}`);
      }
    } else {
      // Local Storage Fallback
      const updatedSlides = slides.filter((s) => s.id !== deletingItem.id);
      setSlides(updatedSlides);
      localStorage.setItem("berakit_about_slides_cache", JSON.stringify(updatedSlides));
      toast.success("Slide berhasil dihapus secara lokal.");
      setIsDeleteOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Supabase Status Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${isUsingSupabase ? "bg-emerald-500 animate-pulse" : "bg-orange-500 animate-pulse"}`} />
          <span className="font-medium">
            {isUsingSupabase
              ? "Koneksi Database: Tersambung ke Supabase Cloud (Live)"
              : "Koneksi Database: Menggunakan Penyimpanan Lokal (Fallback)"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold sm:text-xl flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              Kelola Slide Halaman About Us
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Unggah dan atur rangkaian gambar besar/slide presentasi yang ditampilkan di bagian atas halaman About Us.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button size="sm" onClick={handleAddClick} className="h-8 sm:h-9 gap-1 shrink-0">
              <Plus className="size-4" />
              Tambah Slide
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto p-2 sm:p-4">
          {loading ? (
            <div className="w-full py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-zinc-400" />
              <span className="text-xs text-muted-foreground">Memuat data slide...</span>
            </div>
          ) : slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <PackageX className="size-12 text-muted-foreground/60" />
              <div>
                <h3 className="font-semibold text-sm">Belum ada slide banner</h3>
                <p className="text-xs text-muted-foreground mt-1">Tambahkan slide banner pertama Anda sekarang.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[80px]">Slide</TableHead>
                  <TableHead>Judul Slide</TableHead>
                  <TableHead>Keterangan / Caption</TableHead>
                  <TableHead className="w-[80px] text-center">Urutan</TableHead>
                  <TableHead className="w-[100px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((item) => (
                  <TableRow key={item.id} className="transition-all duration-200">
                    <TableCell>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-16 h-10 object-cover rounded border"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-sm max-w-[200px] truncate uppercase">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                      {item.caption}
                    </TableCell>
                    <TableCell className="text-center font-bold text-xs">
                      <Badge variant="secondary" className="px-2 py-0.5 font-bold">
                        {item.order_index || 0}
                      </Badge>
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
          )}
        </div>
      </div>

      {/* Add/Edit Slide Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Slide Banner" : "Tambah Slide Banner Baru"}</DialogTitle>
              <DialogDescription>
                Tentukan gambar besar, judul, caption, dan urutan kemunculan slide di halaman About Us.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Title */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Judul Slide *</label>
                <Input
                  required
                  placeholder="Misal: CRAFTED BY NATURE"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Caption */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Keterangan / Caption *</label>
                <textarea
                  required
                  className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Deskripsi singkat yang tampil melayang di atas gambar slide..."
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                />
              </div>

              {/* Order Index */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Urutan Slide (Angka) *</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={formOrderIndex}
                  onChange={(e) => setFormOrderIndex(Number(e.target.value))}
                />
              </div>

              {/* Image Uploader */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold">Foto Banner Slide</label>
                
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
                          onClick={() => document.getElementById("slide-file-upload")?.click()}
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
                    onClick={() => document.getElementById("slide-file-upload")?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <UploadCloud className="size-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-primary hover:underline">
                        {isDragging ? "Lepaskan untuk mengunggah" : "Klik atau seret file ke sini"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, JPEG (Maks. 3MB)</p>
                    </div>
                  </div>
                )}
                
                <input
                  id="slide-file-upload"
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
                      placeholder="https://example.com/slide-image.jpg"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                        setUploadFile(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
                {editingItem ? "Simpan Perubahan" : "Simpan Slide"}
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
            <DialogTitle className="text-center">Hapus Slide Banner?</DialogTitle>
            <DialogDescription className="text-center">
              Tindakan ini tidak dapat dibatalkan. Slide <strong>{deletingItem?.title}</strong> akan dihapus permanen.
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
