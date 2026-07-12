import { NextRequest, NextResponse } from "next/server";
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
    const { action, email, password, redirectTo, accessToken, refreshToken } = await req.json();

    if (action === "signIn") {
      // MODE 1: LOCAL JSON DB - Hardcoded admin credentials
      if (useLocalJsonDb) {
        if (email === "admin@berakit.desa.id" && password === "adminberakit") {
          return NextResponse.json({ data: { user: { email } }, error: null });
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
        return NextResponse.json({ data, error: null });
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
