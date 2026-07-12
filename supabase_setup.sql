-- Clean up existing tables to avoid column mismatches (Warning: this deletes existing data in these tables)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.gallery CASCADE;

-- 1. Create PRODUCTS Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ORDERS Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    address TEXT,
    payment_method TEXT,
    items JSONB,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending'::text,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create ORDER_ITEMS Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL
);

-- 4. Create SETTINGS Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY, -- 'bumdes_config'
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    enable_cod BOOLEAN DEFAULT true,
    enable_bank_transfer BOOLEAN DEFAULT true,
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT,
    flat_shipping_rate NUMERIC DEFAULT 0,
    min_free_shipping NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create GALLERY Table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Insert Default Setting Row (required for settings loader)
INSERT INTO public.settings (
    id, name, email, phone, address, enable_cod, enable_bank_transfer,
    bank_name, account_number, account_holder, flat_shipping_rate, min_free_shipping
)
VALUES (
    'bumdes_config',
    'BUMDes Berakit',
    'bumdes@berakit.desa.id',
    '081234567890',
    'Desa Wisata Berakit, Bintan, Kepulauan Riau',
    true,
    true,
    'Bank Riau Kepri Syariah',
    '1092003841',
    'BUMDES BERAKIT UTAMA',
    15000,
    300000
)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Default Products
INSERT INTO public.products (name, description, price, stock, image_url, category)
VALUES 
('Batik Tulis Biota Laut', 'Batik tulis eksklusif dengan motif terumbu karang dan gonggong khas pesisir Berakit. Dibuat menggunakan pewarna alam premium.', 450000, 24, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60', 'Batik Tulis'),
('Batik Cap Mangrove Berakit', 'Batik cap motif daun mangrove dengan desain geometris modern, sangat cocok untuk pakaian formal dan semi-formal.', 195000, 80, 'https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500&auto=format&fit=crop&q=60', 'Batik Cap'),
('Batik Kombinasi Semelur', 'Perpaduan elegan teknik cap dan canting tulis dengan corak ombak samudra biru tua yang menawan.', 295000, 5, 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60', 'Batik Kombinasi'),
('Selendang Sutra Batik Berakit', 'Selendang sutra premium bermotif batik tulis pesisir yang halus, memberikan sentuhan mewah pada penampilan Anda.', 150000, 12, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60', 'Aksesoris');

-- 8. Seed Default Orders
INSERT INTO public.orders (customer_name, customer_phone, address, payment_method, total_amount, status, created_at, items)
VALUES
('Budi Santoso', '081234567890', 'Jl. Raya Berakit No. 12, Desa Berakit', 'Transfer Bank', 170000, 'Selesai', NOW() - INTERVAL '1 day', '[{"name": "Batik Cap Mangrove Berakit", "price": 195000, "quantity": 1}]'::jsonb),
('Siti Rahma', '089876543210', 'RT 02 / RW 01, Dusun 2 Desa Berakit', 'COD', 35000, 'Pending', NOW(), '[{"name": "Selendang Sutra Batik Berakit", "price": 150000, "quantity": 1}]'::jsonb);

-- 9. Setup Storage Buckets (Optional - can also be done manually in Supabase Dashboard)
-- Make sure to create public buckets named 'gallery' and 'receipts' in your Supabase storage panel.

-- 10. Disable Row-Level Security (RLS) on all tables for easy public access
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery DISABLE ROW LEVEL SECURITY;
