import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasValidCredentials = 
  isValidUrl(supabaseUrl) && 
  supabaseAnonKey && 
  supabaseAnonKey !== "your_supabase_anon_key_here";

if (!hasValidCredentials) {
  console.warn(
    "Supabase credentials are missing or invalid. Dashboard is running in LocalStorage mode."
  );
}

// Custom fetch wrapper that converts network errors into 503 responses
// instead of throwing TypeError: Failed to fetch. This prevents the
// Supabase SDK's internal auth initialization from crashing when offline.
const safeFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch {
    return new Response(
      JSON.stringify({ message: "Network unavailable", error: "network_error" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: safeFetch,
      },
    })
  : (null as any);

export const withTimeout = (promise: Promise<any>, timeoutMs: number = 1500): Promise<any> => {
  // Prevent unhandled promise rejection warnings in the browser if the
  // promise rejects in the background after the timeout has already resolved.
  promise.catch(() => {});

  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    ),
  ]);
};
