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

// Cache client instance to prevent multiple GoTrueClient warnings on Next.js HMR/Fast Refresh
const getSupabaseClient = () => {
  if (!hasValidCredentials) return null as any;
  
  if (typeof window !== "undefined") {
    const globalObj = globalThis as any;
    if (!globalObj.__supabaseClient) {
      globalObj.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: true,
          detectSessionInUrl: false,
        },
        global: {
          fetch: safeFetch,
        },
      });
    }
    return globalObj.__supabaseClient;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: safeFetch,
    },
  });
};

export const supabase = getSupabaseClient();

export const withTimeout = (promise: any, timeoutMs: number = 8000): Promise<any> => {
  const realPromise = Promise.resolve(promise);
  realPromise.catch(() => {});

  return Promise.race([
    realPromise,
    new Promise<any>((resolve) =>
      setTimeout(() => {
        resolve({ data: null, error: { message: "Request timeout", isTimeout: true } });
      }, timeoutMs)
    ),
  ]);
};
