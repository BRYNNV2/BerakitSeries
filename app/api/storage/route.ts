import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const useLocalJsonDb = process.env.NEXT_PUBLIC_USE_LOCAL_JSON_DB === "true";

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const filePath = formData.get("path") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // MODE 1: LOCAL JSON DB - Save file to public/uploads/
    if (useLocalJsonDb) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const fullPath = path.join(uploadDir, fileName);
      fs.writeFileSync(fullPath, buffer);
      
      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({ data: { path: filePath, publicUrl }, error: null });
    }

    // MODE 2: SUPABASE PROXY - Upload to Supabase Storage Server-Side
    if (supabaseServer) {
      const { data, error } = await supabaseServer.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        console.error("Supabase Storage Proxy Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { data: urlData } = supabaseServer.storage.from(bucket).getPublicUrl(filePath);
      return NextResponse.json({ data: { path: data.path, publicUrl: urlData.publicUrl }, error: null });
    }

    return NextResponse.json({ error: "Storage configuration mismatch" }, { status: 500 });
  } catch (err: any) {
    console.error("Storage upload proxy error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
