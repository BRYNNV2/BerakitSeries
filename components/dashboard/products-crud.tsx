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
  ShoppingBag,
  Loader2,
  PackageX,
  AlertTriangle,
  UploadCloud,
  X,
} from "lucide-react";
import { supabase, withTimeout, handleSupabaseError } from "@/lib/supabase";
import { addActivityLog } from "@/lib/logger";
import { LoadingLottie } from "@/components/ui/loading-lottie";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
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

const formatRupiah = (val: string | number) => {
  const numString = String(val).replace(/\D/g, "");
  if (!numString) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numString));
};

const DEFAULT_PRODUCTS: Product[] = [];

import { useDashboardStore } from "@/store/dashboard-store";

export function ProductsCrud() {
  const [products, setProducts] = React.useState<Product[]>([]);
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
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formPrice, setFormPrice] = React.useState<string>("");
  const [formStock, setFormStock] = React.useState(0);
  const [formCategory, setFormCategory] = React.useState("Batik Tulis");
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
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);

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
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
        );

        if (error) throw error;

        setProducts(data || []);
        setIsUsingSupabase(true);
      } catch (err: any) {
        handleSupabaseError("ProductsCrud.loadData", err);
        toast.error(`Gagal mengambil data dari Supabase: ${err.message || err.details || err}`);
        setProducts([]);
        setIsUsingSupabase(false);
      }
    } else {
      loadLocalStorage();
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (highlightItemId && products.length > 0) {
      const exists = products.some((p) => p.id === highlightItemId);
      if (exists) {
        const timer = setTimeout(() => {
          const el = document.getElementById(`product-${highlightItemId}`);
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
  }, [highlightItemId, products, setHighlightItemId]);

  const loadLocalStorage = () => {
    setIsUsingSupabase(false);
    const local = localStorage.getItem("berakit_products");
    if (local) {
      setProducts(JSON.parse(local));
    } else {
      localStorage.setItem("berakit_products", JSON.stringify([]));
      setProducts([]);
    }
  };

  const saveProducts = async (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    if (!isUsingSupabase) {
      localStorage.setItem("berakit_products", JSON.stringify(updatedProducts));
    }
  };

  // Open Form for Add
  const handleAddClick = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormStock(0);
    setFormCategory("Batik Tulis");
    setFormImageUrl("");
    setUploadFile(null);
    setImagePreview("");
    setShowUrlField(false);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormPrice(formatRupiah(product.price));
    setFormStock(product.stock);
    setFormCategory(product.category || "Batik Tulis");
    setFormImageUrl(product.image_url || "");
    setUploadFile(null);
    setImagePreview(product.image_url || "");
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
    if (!formName.trim()) return;

    setSubmitting(true);
    let finalImageUrl = formImageUrl || imagePreview || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60";

    // Handle file upload
    if (uploadFile) {
      try {
        // Try uploading to Supabase Storage in "products" bucket
        if (isUsingSupabase && supabase) {
          const fileExt = uploadFile.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("products")
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
              .from("products")
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

    const newProductData = {
      name: formName,
      description: formDescription,
      price: Number(String(formPrice).replace(/\D/g, "")),
      stock: Number(formStock),
      category: formCategory,
      image_url: finalImageUrl,
    };

    if (isUsingSupabase) {
      try {
        if (editingProduct) {
          // Update Supabase
          const { data, error } = await supabase
            .from("products")
            .update(newProductData)
            .eq("id", editingProduct.id)
            .select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Kebijakan keamanan RLS memblokir aksi edit.");
          }
          addActivityLog(
            "Edit Produk",
            `Mengubah data produk '${newProductData.name}' (Supabase)`,
            "product"
          );
          toast.success(`Produk '${newProductData.name}' berhasil diperbarui.`);
        } else {
          // Insert Supabase
          const { data, error } = await supabase
            .from("products")
            .insert([newProductData])
            .select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Kebijakan keamanan RLS memblokir aksi tambah.");
          }
          addActivityLog(
            "Tambah Produk",
            `Menambahkan produk baru '${newProductData.name}' dengan harga Rp ${newProductData.price.toLocaleString("id-ID")} dan stok ${newProductData.stock} (Supabase)`,
            "product"
          );
          toast.success(`Produk baru '${newProductData.name}' berhasil ditambahkan.`);
        }
        await loadData();
        setIsFormOpen(false);
      } catch (err: any) {
        toast.error(`Gagal menyimpan ke Supabase: ${err.message || err}`);
        console.error(err);
      }
    } else {
      // LocalStorage CRUD
      if (editingProduct) {
        const updated = products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...newProductData } : p
        );
        saveProducts(updated);
        addActivityLog(
          "Edit Produk",
          `Mengubah data produk '${newProductData.name}' (Lokal)`,
          "product"
        );
        toast.success(`Produk '${newProductData.name}' berhasil diperbarui secara lokal.`);
      } else {
        const newItem: Product = {
          id: "prod-" + Date.now(),
          ...newProductData,
        };
        saveProducts([newItem, ...products]);
        addActivityLog(
          "Tambah Produk",
          `Menambahkan produk baru '${newProductData.name}' dengan harga Rp ${newProductData.price.toLocaleString("id-ID")} dan stok ${newProductData.stock} (Lokal)`,
          "product"
        );
        toast.success(`Produk baru '${newProductData.name}' berhasil ditambahkan secara lokal.`);
      }
      setIsFormOpen(false);
    }
    setSubmitting(false);
  };

  // Open Delete Dialog
  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    setSubmitting(true);
    if (isUsingSupabase) {
      try {
        const { data, error } = await supabase
          .from("products")
          .delete()
          .eq("id", deletingProduct.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Kebijakan keamanan RLS memblokir akses hapus.");
        }
        addActivityLog(
          "Hapus Produk",
          `Menghapus produk '${deletingProduct.name}' (Supabase)`,
          "product"
        );
        toast.success(`Produk '${deletingProduct.name}' berhasil dihapus.`);
        await loadData();
      } catch (err: any) {
        console.error(err);
        toast.error(`Gagal menghapus produk dari Supabase: ${err.message || err}`);
      }
    } else {
      const updated = products.filter((p) => p.id !== deletingProduct.id);
      saveProducts(updated);
      addActivityLog(
        "Hapus Produk",
        `Menghapus produk '${deletingProduct.name}' (Lokal)`,
        "product"
      );
      toast.success(`Produk '${deletingProduct.name}' berhasil dihapus secara lokal.`);
    }
    setIsDeleteOpen(false);
    setSubmitting(false);
    setDeletingProduct(null);
  };

  // Filter Products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const categories = [
    "Batik Mangrove",
    "Batik Cap",
    "Batik Eco Print",
    "Batik Tulis",
    "Batik Kombinasi",
    "Aksesoris"
  ];

  return (
    <div className="space-y-4">
      {/* Supabase Status Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${isUsingSupabase ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="font-medium">
            Status Database: {isUsingSupabase ? "Tersambung ke Supabase Cloud" : "Penyimpanan Lokal Sementara (Demo)"}
          </span>
        </div>
        {!isUsingSupabase && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Isi file <code>.env.local</code> untuk menyambungkan ke Supabase.
          </span>
        )}
      </div>

      <div className="rounded-xl border bg-card">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Daftar Produk Desa</h2>
              <p className="text-[11px] text-muted-foreground">Total produk terdaftar: {filteredProducts.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 sm:h-9 text-sm"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 sm:h-9 w-[130px] text-sm">
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

            {/* Add Product Button */}
            <Button size="sm" onClick={handleAddClick} className="h-8 sm:h-9 gap-1">
              <Plus className="size-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto p-2 sm:p-4">
          {showSpinner ? (
            <LoadingLottie size={100} label="Memuat data produk..." />
          ) : loading ? (
            <div className="h-[200px]" />
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center animate-in fade-in duration-300">
              <PackageX className="size-12 text-muted-foreground/60" />
              <div>
                <h3 className="font-semibold text-sm">Tidak ada produk ditemukan</h3>
                <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan pencarian atau tambahkan produk baru.</p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="hidden md:table-cell">Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      id={`product-${product.id}`}
                      className={highlightItemId === product.id ? "item-highlight transition-all duration-500" : "transition-all duration-300"}
                    >
                      <TableCell>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="size-10 sm:size-12 object-cover rounded-md border"
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="font-medium text-sm block truncate">{product.name}</span>
                        <span className="text-[11px] text-muted-foreground block truncate md:hidden">
                          {product.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1 hidden sm:block">
                          {product.description}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="font-normal text-[11px]">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm tabular-nums">
                        Rp {product.price.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-semibold ${product.stock <= 5 ? "text-rose-500" : "text-muted-foreground"}`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditClick(product)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(product)}
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

      {/* Add/Edit Product Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
              <DialogDescription>
                Lengkapi detail informasi produk khas Desa Berakit di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Nama Produk *</label>
                <Input
                  required
                  placeholder="Misal: Madu Hutan Asli"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">Kategori</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori" />
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
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold">Stok Produk *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">Harga Jual (Rupiah) *</label>
                <Input
                  required
                  type="text"
                  placeholder="Contoh: 12.000"
                  value={formPrice}
                  onChange={(e) => {
                    const formatted = formatRupiah(e.target.value);
                    setFormPrice(formatted);
                  }}
                />
              </div>

              {/* Foto Produk */}
              <div className="grid gap-2">
                <label className="text-xs font-semibold">Foto Produk</label>
                
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
                          onClick={() => document.getElementById("file-upload")?.click()}
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
                    onClick={() => document.getElementById("file-upload")?.click()}
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
                  id="file-upload"
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
                <label className="text-xs font-semibold">Deskripsi Produk</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Keterangan singkat produk..."
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
                {editingProduct ? "Simpan Perubahan" : "Simpan Produk"}
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
            <DialogTitle className="text-center">Hapus Produk?</DialogTitle>
            <DialogDescription className="text-center">
              Tindakan ini tidak dapat dibatalkan. Produk <strong>{deletingProduct?.name}</strong> akan dihapus permanen.
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
