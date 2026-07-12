import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

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

const convertToWebP = (file: File, quality = 0.85): Promise<File> => {
  if (typeof window === "undefined") return Promise.resolve(file);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp", lastModified: Date.now() }
            );
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

// Custom fetch wrapper that converts network errors into 503 responses
// instead of throwing TypeError: Failed to fetch. This prevents the
// Supabase SDK's internal auth initialization from crashing when offline.
const safeFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    console.warn("safeFetch: fetch failed for", input, "Error details:", err);
    return new Response(
      JSON.stringify({ message: "Network unavailable", error: "network_error" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
};

const useLocalJsonDb = process.env.NEXT_PUBLIC_USE_LOCAL_JSON_DB === "true";

const createLocalClient = (): any => {
  const queryBuilder = (table: string, filters: any = null, order: any = null) => {
    const builder: any = {
      select: (columns: string = "*") => {
        const selectBuilder: any = {
          eq: (col: string, val: any) => {
            const nextFilters = { ...filters, [col]: val };
            const eqBuilder: any = {
              single: async () => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "select", filters: nextFilters }),
                });
                const { data, error } = await res.json();
                return { data: data?.[0] || null, error };
              },
              then: async (resolve: any) => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "select", filters: nextFilters }),
                });
                resolve(await res.json());
              }
            };
            return eqBuilder;
          },
          order: (column: string, { ascending = true } = {}) => {
            const nextOrder = { column, ascending };
            const orderBuilder: any = {
              then: async (resolve: any) => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "select", order: nextOrder }),
                });
                resolve(await res.json());
              }
            };
            return orderBuilder;
          },
          then: async (resolve: any) => {
            const res = await fetch("/api/db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ table, action: "select", filters }),
            });
            resolve(await res.json());
          }
        };
        return selectBuilder;
      },
      insert: (data: any) => {
        const insertBuilder: any = {
          select: (cols: string = "*") => {
            const selectBuilder: any = {
              single: async () => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "insert", data }),
                });
                const { data: resData, error } = await res.json();
                return { data: resData?.[0] || null, error };
              },
              then: async (resolve: any) => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "insert", data }),
                });
                resolve(await res.json());
              }
            };
            return selectBuilder;
          },
          then: async (resolve: any) => {
            const res = await fetch("/api/db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ table, action: "insert", data }),
            });
            resolve(await res.json());
          }
        };
        return insertBuilder;
      },
      update: (data: any) => {
        const updateBuilder: any = {
          eq: (col: string, val: any) => {
            const nextFilters = { ...filters, [col]: val };
            const eqBuilder: any = {
              select: () => {
                const selectBuilder: any = {
                  then: async (resolve: any) => {
                    const res = await fetch("/api/db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ table, action: "update", data, filters: nextFilters }),
                    });
                    resolve(await res.json());
                  }
                };
                return selectBuilder;
              },
              then: async (resolve: any) => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "update", data, filters: nextFilters }),
                });
                resolve(await res.json());
              }
            };
            return eqBuilder;
          }
        };
        return updateBuilder;
      },
      delete: () => {
        const deleteBuilder: any = {
          neq: (col: string, val: any) => {
            const nextFilters = { ...filters, [col]: val };
            const neqBuilder: any = {
              select: () => {
                const selectBuilder: any = {
                  then: async (resolve: any) => {
                    const res = await fetch("/api/db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ table, action: "delete", filters: nextFilters }),
                    });
                    resolve(await res.json());
                  }
                };
                return selectBuilder;
              },
              then: async (resolve: any) => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "delete", filters: nextFilters }),
                });
                resolve(await res.json());
              }
            };
            return neqBuilder;
          },
          eq: (col: string, val: any) => {
            const nextFilters = { ...filters, [col]: val };
            const eqBuilder: any = {
              select: () => {
                const selectBuilder: any = {
                  then: async (resolve: any) => {
                    const res = await fetch("/api/db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ table, action: "delete", filters: nextFilters }),
                    });
                    resolve(await res.json());
                  }
                };
                return selectBuilder;
              },
              then: async (resolve: any) => {
                const res = await fetch("/api/db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ table, action: "delete", filters: nextFilters }),
                });
                resolve(await res.json());
              }
            };
            return eqBuilder;
          }
        };
        return deleteBuilder;
      }
    };
    return builder;
  };

  return {
    from: (table: string) => queryBuilder(table),
    storage: {
      from: (bucket: string) => ({
        upload: async (filePath: string, file: File) => {
          try {
            let fileToUpload = file;
            let targetPath = filePath;

            // Automatically convert image files (png, jpeg, etc.) to webp
            if (file.type.startsWith("image/") && file.type !== "image/webp") {
              try {
                fileToUpload = await convertToWebP(file, 0.85);
                targetPath = filePath.replace(/\.[^/.]+$/, "") + ".webp";
              } catch (webpErr) {
                console.warn("Failed converting to WebP, uploading original image instead:", webpErr);
              }
            }

            const formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("bucket", bucket);
            formData.append("path", targetPath);

            const res = await fetch("/api/storage", {
              method: "POST",
              body: formData,
            });
            
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              return { data: null, error: { message: errData.error || "Storage upload failed" } };
            }

            const { data, error } = await res.json();
            if (error) return { data: null, error: { message: error } };

            if (typeof window !== "undefined" && data?.publicUrl) {
              const cacheKey = `berakit_url_${bucket}_${targetPath}`;
              window.localStorage.setItem(cacheKey, data.publicUrl);
            }
            return { data: { path: targetPath }, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
        getPublicUrl: (filePath: string) => {
          if (typeof window !== "undefined") {
            const cacheKey = `berakit_url_${bucket}_${filePath}`;
            let cached = window.localStorage.getItem(cacheKey);

            if (!cached) {
              // Try resolving with .webp extension as fallback
              const webpPath = filePath.replace(/\.[^/.]+$/, "") + ".webp";
              const webpCacheKey = `berakit_url_${bucket}_${webpPath}`;
              cached = window.localStorage.getItem(webpCacheKey);
            }

            if (cached) {
              return { data: { publicUrl: cached } };
            }
          }
          return { data: { publicUrl: "/batik-center.png" } };
        }
      })
    },
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        try {
          const res = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "signIn", email, password }),
          });
          const { data, error } = await res.json();
          if (error) return { data: null, error };

          if (typeof window !== "undefined" && data?.user) {
            window.localStorage.setItem("berakit_mock_user", JSON.stringify(data.user));
          }
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      signOut: async () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("berakit_mock_user");
        }
        return { error: null };
      },
      getSession: async () => {
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("berakit_mock_user");
          if (stored) {
            return { data: { session: { user: JSON.parse(stored) } }, error: null };
          }
        }
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("berakit_mock_user");
          if (stored) {
            return { data: { user: JSON.parse(stored) }, error: null };
          }
        }
        return { data: { user: null }, error: null };
      },
      resetPasswordForEmail: async (email: string, options?: any) => {
        try {
          const res = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "resetPassword", 
              email, 
              redirectTo: options?.redirectTo 
            }),
          });
          const { data, error } = await res.json();
          return { data, error };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      updateUser: async ({ password }: any) => {
        try {
          let accessToken = "";
          let refreshToken = "";
          if (typeof window !== "undefined") {
            // First check session storage captured immediately on mount
            accessToken = window.sessionStorage.getItem("berakit_reset_token") || "";
            refreshToken = window.sessionStorage.getItem("berakit_refresh_token") || "";

            // Fallback: check window location hash
            if (!accessToken) {
              const hash = window.location.hash;
              const params = new URLSearchParams(hash.replace("#", "?"));
              accessToken = params.get("access_token") || "";
              refreshToken = params.get("refresh_token") || "";
            }
          }

          const res = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "updatePassword", 
              password, 
              accessToken,
              refreshToken
            }),
          });
          const { data, error } = await res.json();
          return { data, error };
        } catch (err: any) {
          return { data: null, error: { message: err.message } };
        }
      },
      onAuthStateChange: (callback: any) => {
        if (typeof window !== "undefined" && callback) {
          const stored = window.localStorage.getItem("berakit_mock_user");
          const session = stored ? { user: JSON.parse(stored) } : null;
          // Trigger initial session check
          setTimeout(() => {
            callback("INITIAL_SESSION", session);
          }, 0);
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      }
    }
  };
};

// Cache client instance to prevent multiple GoTrueClient warnings on Next.js HMR/Fast Refresh
const getSupabaseClient = () => {
  return createLocalClient();
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

export const handleSupabaseError = (context: string, error: any) => {
  const isNetwork = 
    !error ||
    error?.message === "Network unavailable" || 
    error?.error === "network_error" || 
    error?.status === 503 ||
    (typeof error === "object" && Object.keys(error).length === 0);

  if (isNetwork) {
    console.warn(`[Supabase Offline Mode] ${context}: Supabase is unreachable. Falling back to LocalStorage.`);
    if (typeof window !== "undefined" && !window.localStorage.getItem("berakit_force_local_db")) {
      window.localStorage.setItem("berakit_force_local_db", "true");
      console.log("[Supabase Offline Mode] Automatically activated LocalStorage sandbox for this session.");
    }
  } else {
    console.error(`${context}:`, error);
  }
};
