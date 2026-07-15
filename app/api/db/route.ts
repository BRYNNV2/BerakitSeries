import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const DB_FILE = path.join(process.cwd(), "db.json");
const useLocalJsonDb = process.env.NEXT_PUBLIC_USE_LOCAL_JSON_DB === "true";

// Initialize Supabase client ONLY for server-side use
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

const hasValidCredentials = 
  supabaseUrl && 
  supabaseUrl.startsWith("http") && 
  supabaseAnonKey && 
  supabaseAnonKey !== "your_supabase_anon_key_here";

const supabaseServer = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  : null;

interface DbSchema {
  products: any[];
  orders: any[];
  settings: any[];
  gallery: any[];
}

function readDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbSchema = {
      products: [
        {
          id: "prod-1",
          name: "Batik Tulis Biota Laut",
          description: "Batik tulis eksklusif dengan motif terumbu karang dan gonggong khas pesisir Berakit. Dibuat menggunakan pewarna alam premium.",
          price: 450000,
          stock: 24,
          image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=60",
          category: "Batik Tulis",
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-2",
          name: "Batik Cap Mangrove Berakit",
          description: "Batik cap motif daun mangrove dengan desain geometris modern, sangat cocok untuk pakaian formal.",
          price: 195000,
          stock: 80,
          image_url: "https://images.unsplash.com/photo-1597484211616-396f17ed3998?w=500&auto=format&fit=crop&q=60",
          category: "Batik Cap",
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-3",
          name: "Batik Kombinasi Semelur",
          description: "Perpaduan elegan teknik cap dan canting tulis dengan corak ombak samudra biru tua.",
          price: 295000,
          stock: 5,
          image_url: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60",
          category: "Batik Kombinasi",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "prod-4",
          name: "Selendang Sutra Batik",
          description: "Selendang sutra premium bermotif batik tulis pesisir yang halus.",
          price: 150000,
          stock: 12,
          image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
          category: "Aksesoris",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      orders: [
        {
          id: "ord-1",
          customer_name: "Budi Santoso",
          customer_phone: "081234567890",
          address: "Jl. Raya Berakit No. 12, Desa Berakit",
          payment_method: "Transfer Bank",
          total_amount: 170000,
          status: "Selesai",
          items: [
            { name: "Batik Cap Mangrove Berakit", price: 195000, quantity: 1 }
          ],
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "ord-2",
          customer_name: "Siti Rahma",
          customer_phone: "089876543210",
          address: "RT 02 / RW 01, Dusun 2 Desa Berakit",
          payment_method: "COD",
          total_amount: 150000,
          status: "Pending",
          items: [
            { name: "Selendang Sutra Batik", price: 150000, quantity: 1 }
          ],
          created_at: new Date().toISOString()
        }
      ],
      settings: [
        {
          id: "bumdes_config",
          name: "BUMDes Berakit",
          email: "bumdes@berakit.desa.id",
          phone: "081234567890",
          address: "Desa Wisata Berakit, Bintan, Kepulauan Riau",
          enable_cod: true,
          enable_bank_transfer: true,
          bank_name: "Bank Riau Kepri Syariah",
          account_number: "1092003841",
          account_holder: "BUMDES BERAKIT UTAMA",
          flat_shipping_rate: 15000,
          min_free_shipping: 300000
        }
      ],
      gallery: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading db.json, returning empty structure", e);
    return { products: [], orders: [], settings: [], gallery: [] };
  }
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing db.json", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { table, action, data, filters, order, limit } = await req.json();

    // IF USING REAL SUPABASE SERVER-SIDE PROXY
    if (!useLocalJsonDb && supabaseServer) {
      if (action === "select") {
        let query = supabaseServer.from(table).select("*");
        if (filters) {
          Object.entries(filters).forEach(([key, val]) => {
            query = query.eq(key, val);
          });
        }
        if (order) {
          query = query.order(order.column, { ascending: order.ascending });
        }
        if (limit) {
          query = query.limit(limit);
        }
        const { data: resData, error } = await query;
        return NextResponse.json({ data: resData, error });
      }

      if (action === "insert") {
        const { data: resData, error } = await supabaseServer.from(table).insert(data).select();
        return NextResponse.json({ data: resData, error });
      }

      if (action === "update") {
        let query = supabaseServer.from(table).update(data);
        if (filters) {
          Object.entries(filters).forEach(([key, val]) => {
            query = query.eq(key, val);
          });
        }
        const { data: resData, error } = await query.select();
        return NextResponse.json({ data: resData, error });
      }

      if (action === "delete") {
        let query = supabaseServer.from(table).delete();
        if (filters) {
          Object.entries(filters).forEach(([key, val]) => {
            query = query.eq(key, val);
          });
        }
        const { data: resData, error } = await query.select();
        return NextResponse.json({ data: resData, error });
      }
    }

    // FALLBACK: LOCAL JSON DATABASE
    const db = readDb();
    const tbl = table as keyof DbSchema;
    if (!db[tbl]) {
      (db as any)[tbl] = [];
    }

    if (action === "select") {
      let result = [...db[tbl]];
      if (filters) {
        result = result.filter((item: any) => {
          return Object.entries(filters).every(([key, val]) => {
            return String(item[key]) === String(val);
          });
        });
      }
      if (order) {
        const { column, ascending } = order;
        result.sort((a: any, b: any) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
      }
      if (limit) {
        result = result.slice(0, limit);
      }
      return NextResponse.json({ data: result, error: null });
    }

    if (action === "insert") {
      const itemsToInsert = Array.isArray(data) ? data : [data];
      const inserted: any[] = [];
      for (const item of itemsToInsert) {
        const newItem = {
          id: item.id || `id-${Math.random().toString(36).substring(2, 11)}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item
        };
        db[tbl].push(newItem);
        inserted.push(newItem);
      }
      writeDb(db);
      return NextResponse.json({ data: inserted, error: null });
    }

    if (action === "update") {
      let updated: any[] = [];
      db[tbl] = db[tbl].map((item: any) => {
        const matches = filters ? Object.entries(filters).every(([key, val]) => String(item[key]) === String(val)) : true;
        if (matches) {
          const newItem = { ...item, ...data };
          updated.push(newItem);
          return newItem;
        }
        return item;
      }) as any;
      writeDb(db);
      return NextResponse.json({ data: updated, error: null });
    }

    if (action === "delete") {
      db[tbl] = db[tbl].filter((item: any) => {
        const matches = filters ? Object.entries(filters).every(([key, val]) => String(item[key]) === String(val)) : true;
        return !matches;
      }) as any;
      writeDb(db);
      return NextResponse.json({ data: null, error: null });
    }

    return NextResponse.json({ data: null, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Local/Proxy DB Route error:", err);
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
