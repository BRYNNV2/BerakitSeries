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
} from "lucide-react";
import { supabase, withTimeout } from "@/lib/supabase";
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

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Batik Tulis Biota Laut",
    description: "Batik tulis eksklusif dengan motif terumbu karang dan gonggong khas pesisir Berakit. Dibuat menggunakan pewarna alam premium.",
    price: 450000,
    stock: 24,
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60",
    category: "Batik Tulis",
  },
  {
    id: "prod-2",
    name: "Batik Cap Mangrove Berakit",
    description: "Batik cap motif daun mangrove dengan desain geometris modern, sangat cocok untuk pakaian formal dan semi-formal.",
    price: 195000,
    stock: 80,
    image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500&auto=format&fit=crop&q=60",
    category: "Batik Cap",
  },
  {
    id: "prod-3",
    name: "Batik Kombinasi Semelur",
    description: "Perpaduan elegan teknik cap dan canting tulis dengan corak ombak samudra biru tua yang menawan.",
    price: 295000,
    stock: 5,
    image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60",
    category: "Batik Kombinasi",
  },
  {
    id: "prod-4",
    name: "Selendang Sutra Batik Berakit",
    description: "Selendang sutra premium bermotif batik tulis pesisir yang halus, memberikan sentuhan mewah pada penampilan Anda.",
    price: 150000,
    stock: 12,
    image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
    category: "Aksesoris",
  },
];

export function ProductsCrud() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isUsingSupabase, setIsUsingSupabase] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  // Form Dialog States
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formPrice, setFormPrice] = React.useState(0);
  const [formStock, setFormStock] = React.useState(0);
  const [formCategory, setFormCategory] = React.useState("Batik Tulis");
  const [formImageUrl, setFormImageUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);

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

        if (data && data.length === 0) {
          // Auto-seed default products to make the database instantly alive
          const seedData = DEFAULT_PRODUCTS.map(({ name, description, price, stock, image_url, category }) => ({
            name, description, price, stock, image_url, category
          }));
          const { error: seedError } = await supabase.from("products").insert(seedData);
          if (!seedError) {
            const { data: refetched } = await withTimeout(
              supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false })
            );
            setProducts(refetched || []);
          } else {
            setProducts([]);
          }
        } else {
          setProducts(data || []);
        }
        setIsUsingSupabase(true);
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to LocalStorage:", err);
        loadLocalStorage();
      }
    } else {
      loadLocalStorage();
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const loadLocalStorage = () => {
    setIsUsingSupabase(false);
    const local = localStorage.getItem("berakit_products");
    if (local) {
      setProducts(JSON.parse(local));
    } else {
      localStorage.setItem("berakit_products", JSON.stringify(DEFAULT_PRODUCTS));
      setProducts(DEFAULT_PRODUCTS);
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
    setFormPrice(0);
    setFormStock(0);
    setFormCategory("Batik Tulis");
    setFormImageUrl("");
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormPrice(product.price);
    setFormStock(product.stock);
    setFormCategory(product.category || "Batik Tulis");
    setFormImageUrl(product.image_url || "");
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSubmitting(true);
    const newProductData = {
      name: formName,
      description: formDescription,
      price: Number(formPrice),
      stock: Number(formStock),
      category: formCategory,
      image_url: formImageUrl || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60",
    };

    if (isUsingSupabase) {
      try {
        if (editingProduct) {
          // Update Supabase
          const { error } = await supabase
            .from("products")
            .update(newProductData)
            .eq("id", editingProduct.id);
          if (error) throw error;
          addActivityLog(
            "Edit Produk",
            `Mengubah data produk '${newProductData.name}' (Supabase)`,
            "product"
          );
          toast.success(`Produk '${newProductData.name}' berhasil diperbarui.`);
        } else {
          // Insert Supabase
          const { error } = await supabase.from("products").insert([newProductData]);
          if (error) throw error;
          addActivityLog(
            "Tambah Produk",
            `Menambahkan produk baru '${newProductData.name}' dengan harga Rp ${newProductData.price.toLocaleString("id-ID")} dan stok ${newProductData.stock} (Supabase)`,
            "product"
          );
          toast.success(`Produk baru '${newProductData.name}' berhasil ditambahkan.`);
        }
        await loadData();
        setIsFormOpen(false);
      } catch (err) {
        toast.warning("Gagal menyimpan ke Supabase. Menggunakan penyimpanan lokal sementara.");
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
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", deletingProduct.id);
        if (error) throw error;
        addActivityLog(
          "Hapus Produk",
          `Menghapus produk '${deletingProduct.name}' (Supabase)`,
          "product"
        );
        toast.success(`Produk '${deletingProduct.name}' berhasil dihapus.`);
        await loadData();
      } catch (err) {
        console.error(err);
        toast.error("Gagal menghapus produk dari Supabase.");
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
          {loading ? (
            <LoadingLottie size={100} label="Memuat data produk..." />
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <PackageX className="size-12 text-muted-foreground/60" />
              <div>
                <h3 className="font-semibold text-sm">Tidak ada produk ditemukan</h3>
                <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan pencarian atau tambahkan produk baru.</p>
              </div>
            </div>
          ) : (
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
                  <TableRow key={product.id}>
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
                  type="number"
                  min="0"
                  placeholder="Rp 0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                />
              </div>

              {/* Image URL */}
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold">URL Foto Produk</label>
                <Input
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">
                  Tempel URL foto produk (Unsplash, Imgur, dll.) untuk visualisasi produk.
                </span>
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
