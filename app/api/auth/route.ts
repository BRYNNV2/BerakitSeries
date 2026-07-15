import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");
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

interface DbSchema {
  products: any[];
  orders: any[];
  settings: any[];
  gallery: any[];
  profiles?: any[];
}

function readDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    return { products: [], orders: [], settings: [], gallery: [], profiles: [] };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.profiles) parsed.profiles = [];
    return parsed;
  } catch (e) {
    return { products: [], orders: [], settings: [], gallery: [], profiles: [] };
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
    const { action, email, password, redirectTo, accessToken, refreshToken } = await req.json();

    if (action === "signIn") {
      // MODE 1: LOCAL JSON DB
      if (useLocalJsonDb) {
        if (email === "admin@berakit.desa.id" && password === "adminberakit") {
          return NextResponse.json({ data: { user: { email, role: "admin" } }, error: null });
        }
        
        const db = readDb();
        const profiles = db.profiles || [];
        const found = profiles.find((p: any) => p.email === email && p.password === password);
        if (found) {
          return NextResponse.json({
            data: {
              user: {
                id: found.id,
                email: found.email,
                role: found.role || "buyer"
              }
            },
            error: null
          });
        }
        return NextResponse.json({ data: null, error: { message: "Email atau password salah." } });
      }

      // MODE 2: SUPABASE PROXY - Authenticate on Server-Side via Supabase Auth
      if (supabaseServer) {
        const { data, error } = await supabaseServer.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          return NextResponse.json({ data: null, error: { message: error.message } });
        }
        
        // Fetch user profile to get role
        let role = "buyer";
        if (data?.user) {
          if (data.user.email === "admin@berakit.desa.id") {
            role = "admin";
          } else {
            const { data: profile } = await supabaseServer
              .from("profiles")
              .select("role")
              .eq("id", data.user.id)
              .single();
            
            if (profile) {
              role = profile.role;
            } else {
              // Create default profile if not exists
              const { data: newProfile } = await supabaseServer
                .from("profiles")
                .insert({ id: data.user.id, email: data.user.email, role: "buyer" })
                .select("role")
                .single();
              if (newProfile) role = newProfile.role;
            }
          }
        }

        return NextResponse.json({ 
          data: {
            ...data,
            user: data.user ? { ...data.user, role } : null
          }, 
          error: null 
        });
      }

      return NextResponse.json({ data: null, error: { message: "Database configuration mismatch" } });
    }

    if (action === "signUp") {
      // MODE 1: LOCAL JSON DB
      if (useLocalJsonDb) {
        const db = readDb();
        const profiles = db.profiles || [];
        
        // Check if email already exists
        const exists = profiles.some((p: any) => p.email === email);
        if (exists) {
          return NextResponse.json({ data: null, error: { message: "Email ini sudah terdaftar." } });
        }
        
        const newProfile = {
          id: `usr-${Math.random().toString(36).substring(2, 11)}`,
          email,
          password, // Stored locally for mock testing db
          role: "buyer",
          created_at: new Date().toISOString()
        };
        
        profiles.push(newProfile);
        db.profiles = profiles;
        writeDb(db);
        
        return NextResponse.json({ 
          data: { 
            user: { 
              id: newProfile.id,
              email: newProfile.email,
              role: newProfile.role
            } 
          }, 
          error: null 
        });
      }
      
      // MODE 2: SUPABASE PROXY
      if (supabaseServer) {
        const { data, error } = await supabaseServer.auth.signUp({
          email,
          password
        });
        if (error) {
          return NextResponse.json({ data: null, error: { message: error.message } });
        }
        
        // Create user profile in profiles table
        if (data?.user) {
          const { error: profileError } = await supabaseServer
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: "buyer"
            });
          if (profileError) {
            console.warn("Failed creating profile for signed up user:", profileError);
          }
        }
        
        return NextResponse.json({ 
          data: {
            ...data,
            user: data.user ? { ...data.user, role: "buyer" } : null
          }, 
          error: null 
        });
      }
      return NextResponse.json({ data: null, error: { message: "Database configuration mismatch" } });
    }

    if (action === "resetPassword") {
      if (useLocalJsonDb) {
        return NextResponse.json({ data: {}, error: null });
      }
      if (supabaseServer) {
        const { data, error } = await supabaseServer.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`
        });
        if (error) {
          return NextResponse.json({ data: null, error: { message: error.message } });
        }
        return NextResponse.json({ data, error: null });
      }
      return NextResponse.json({ data: null, error: { message: "Database configuration mismatch" } });
    }

    if (action === "updatePassword") {
      if (useLocalJsonDb) {
        return NextResponse.json({ data: {}, error: null });
      }
      if (supabaseServer) {
        // Create custom client without persisting state locally
        const clientWithToken = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });

        // Set the session explicitly so the client is authenticated as the user
        const { error: sessionError } = await clientWithToken.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ""
        });

        if (sessionError) {
          return NextResponse.json({ data: null, error: { message: `Sesi pemulihan gagal disetel: ${sessionError.message}` } });
        }

        const { data, error } = await clientWithToken.auth.updateUser({
          password
        });
        if (error) {
          return NextResponse.json({ data: null, error: { message: error.message } });
        }
        return NextResponse.json({ data, error: null });
      }
      return NextResponse.json({ data: null, error: { message: "Database configuration mismatch" } });
    }

    return NextResponse.json({ data: null, error: { message: "Invalid action" } }, { status: 400 });
  } catch (err: any) {
    console.error("Auth proxy error:", err);
    return NextResponse.json({ data: null, error: { message: err.message } }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
