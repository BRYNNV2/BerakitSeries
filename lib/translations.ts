export type Language = "id" | "en";

export interface TranslationDict {
  nav: {
    home: string;
    products: string;
    gallery: string;
    about: string;
    contact: string;
    careers: string;
    faq: string;
    sizeGuide: string;
    dashboard: string;
    login: string;
    register: string;
    company: string;
    support: string;
    press: string;
    sustainability: string;
    shipping: string;
    returns: string;
  };
  hero: {
    tagline: string;
    subtitle: string;
    exploreBtn: string;
    aboutBtn: string;
    featuredTitle: string;
    featuredDesc: string;
  };
  product: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allCategories: string;
    filterCategory: string;
    price: string;
    stock: string;
    available: string;
    outOfStock: string;
    addToCart: string;
    buyNow: string;
    selectSize: string;
    customLength: string;
    minOrder: string;
    cm: string;
    meters: string;
    pricePerCm: string;
    totalPrice: string;
    cartTitle: string;
    emptyCart: string;
    checkout: string;
    customerInfo: string;
    name: string;
    phone: string;
    address: string;
    paymentMethod: string;
    bankTransfer: string;
    cod: string;
    sendOrder: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    overview: string;
    products: string;
    transactions: string;
    complaints: string;
    gallery: string;
    aboutSlides: string;
    logs: string;
    settings: string;
    totalSales: string;
    activeProducts: string;
    pendingOrders: string;
    resolvedComplaints: string;
    searchPlaceholder: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    success: string;
    error: string;
    back: string;
    viewAll: string;
    language: string;
    indonesian: string;
    english: string;
  };
}

export const translations: Record<Language, TranslationDict> = {
  id: {
    // Navigation & Common Header
    nav: {
      home: "Beranda",
      products: "Koleksi",
      gallery: "Galeri",
      about: "Tentang Kami",
      contact: "Kontak Kami",
      careers: "Karir",
      faq: "Tanya Jawab (FAQ)",
      sizeGuide: "Panduan Ukuran",
      dashboard: "Dashboard",
      login: "Masuk",
      register: "Daftar",
      company: "Profil",
      support: "Bantuan",
      press: "Siaran Pers",
      sustainability: "Keberlanjutan",
      shipping: "Pengiriman",
      returns: "Garansi & Retur",
    },

    // Hero & Public Sections
    hero: {
      tagline: "ELEVATE YOUR STYLE IN EVERY REALITY",
      subtitle: "BUMDes Desa Berakit - Memperkenalkan Batik Tulis Eksklusif & Produk Unggulan Pesisir Bintan ke Kancah Dunia.",
      exploreBtn: "Jelajahi Produk",
      aboutBtn: "Tentang Berakit",
      featuredTitle: "Koleksi Unggulan Berakit",
      featuredDesc: "Sentuhan karya seni warisan budaya pesisir yang dibuat oleh pengrajin lokal Desa Berakit.",
    },

    // Product Page & Purchasing
    product: {
      title: "Katalog Produk Berakit",
      subtitle: "Temukan produk berkualitas dari kerajinan batik tulis hingga busana pesisir.",
      searchPlaceholder: "Cari batik, busana, atau aksesoris...",
      allCategories: "Semua Kategori",
      filterCategory: "Kategori",
      price: "Harga",
      stock: "Stok",
      available: "Tersedia",
      outOfStock: "Stok Habis",
      addToCart: "Tambah ke Keranjang",
      buyNow: "Beli Sekarang",
      selectSize: "Pilih Ukuran",
      customLength: "Pembelian Per-Centimeter (CM)",
      minOrder: "Minimal pembelian",
      cm: "cm",
      meters: "meter",
      pricePerCm: "Harga per cm",
      totalPrice: "Total Harga",
      cartTitle: "Keranjang Belanja",
      emptyCart: "Keranjang kamu masih kosong",
      checkout: "Proses Pesanan",
      customerInfo: "Informasi Pembeli",
      name: "Nama Lengkap",
      phone: "Nomor WhatsApp",
      address: "Alamat Pengiriman",
      paymentMethod: "Metode Pembayaran",
      bankTransfer: "Transfer Bank / QRIS",
      cod: "Bayar di Tempat (COD)",
      sendOrder: "Kirim Pesanan via WhatsApp",
    },

    // Dashboard Admin
    dashboard: {
      title: "Dashboard BUMDes Berakit",
      subtitle: "Ringkasan performa penjualan dan pengelolaan produk desa.",
      overview: "Ikhtisar",
      products: "Kelola Produk",
      transactions: "Daftar Transaksi",
      complaints: "Pengaduan Masyarakat",
      gallery: "Galeri Dokumentasi",
      aboutSlides: "Slide Tentang Kami",
      logs: "Log Aktivitas",
      settings: "Pengaturan Admin",
      totalSales: "Total Penjualan",
      activeProducts: "Produk Aktif",
      pendingOrders: "Pesanan Diproses",
      resolvedComplaints: "Pengaduan Selesai",
      searchPlaceholder: "Cari produk / galeri...",
    },

    // Action Buttons & Common UI
    common: {
      save: "Simpan",
      cancel: "Batal",
      delete: "Hapus",
      edit: "Edit",
      add: "Tambah Baru",
      search: "Cari",
      loading: "Memuat...",
      success: "Berhasil",
      error: "Terjadi kesalahan",
      back: "Kembali",
      viewAll: "Lihat Semua",
      language: "Bahasa",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
  },

  en: {
    // Navigation & Common Header
    nav: {
      home: "Home",
      products: "Collections",
      gallery: "Gallery",
      about: "About Us",
      contact: "Contact Us",
      careers: "Careers",
      faq: "FAQs",
      sizeGuide: "Size Guide",
      dashboard: "Dashboard",
      login: "Sign In",
      register: "Sign Up",
      company: "Company",
      support: "Support",
      press: "Press",
      sustainability: "Sustainability",
      shipping: "Shipping",
      returns: "Returns",
    },

    // Hero & Public Sections
    hero: {
      tagline: "ELEVATE YOUR STYLE IN EVERY REALITY",
      subtitle: "BUMDes Berakit Village - Presenting Exclusive Handwoven Batik & Coastal Heritage Products to the World.",
      exploreBtn: "Explore Products",
      aboutBtn: "About Berakit",
      featuredTitle: "Berakit Signature Collections",
      featuredDesc: "Crafted touch of coastal cultural heritage by local artisans of Berakit Village.",
    },

    // Product Page & Purchasing
    product: {
      title: "Berakit Product Catalog",
      subtitle: "Discover high quality handwoven batik, apparel, and coastal handicrafts.",
      searchPlaceholder: "Search batik, apparel, or accessories...",
      allCategories: "All Categories",
      filterCategory: "Category",
      price: "Price",
      stock: "Stock",
      available: "In Stock",
      outOfStock: "Out of Stock",
      addToCart: "Add to Cart",
      buyNow: "Buy Now",
      selectSize: "Select Size",
      customLength: "Purchase Per Centimeter (CM)",
      minOrder: "Minimum purchase",
      cm: "cm",
      meters: "meters",
      pricePerCm: "Price per cm",
      totalPrice: "Total Price",
      cartTitle: "Shopping Cart",
      emptyCart: "Your cart is currently empty",
      checkout: "Proceed to Checkout",
      customerInfo: "Customer Information",
      name: "Full Name",
      phone: "WhatsApp Number",
      address: "Shipping Address",
      paymentMethod: "Payment Method",
      bankTransfer: "Bank Transfer / QRIS",
      cod: "Cash on Delivery (COD)",
      sendOrder: "Send Order via WhatsApp",
    },

    // Dashboard Admin
    dashboard: {
      title: "BUMDes Berakit Dashboard",
      subtitle: "Sales performance overview and village product management.",
      overview: "Overview",
      products: "Product Management",
      transactions: "Transactions List",
      complaints: "Community Feedback",
      gallery: "Documentation Gallery",
      aboutSlides: "About Us Slides",
      logs: "Activity Logs",
      settings: "Admin Settings",
      totalSales: "Total Sales",
      activeProducts: "Active Products",
      pendingOrders: "Pending Orders",
      resolvedComplaints: "Resolved Issues",
      searchPlaceholder: "Search products / gallery...",
    },

    // Action Buttons & Common UI
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add New",
      search: "Search",
      loading: "Loading...",
      success: "Success",
      error: "An error occurred",
      back: "Back",
      viewAll: "View All",
      language: "Language",
      indonesian: "Bahasa Indonesia",
      english: "English",
    },
  },
};
