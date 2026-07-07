"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardContent } from "@/components/dashboard/content";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // Check local storage fallback first
      const localAuth = localStorage.getItem("berakit_admin_auth");
      if (localAuth === "true") {
        setAuthenticated(true);
        setLoading(false);
        return;
      }

      if (supabase) {
        try {
          const sessionRes = await supabase.auth.getSession();
          const session = sessionRes?.data?.session;
          if (session) {
            setAuthenticated(true);
            setLoading(false);
            return;
          }

          // Listen for auth changes
          const authChangeRes = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (session) {
              setAuthenticated(true);
            } else {
              // Only redirect if local auth is also missing
              const currentLocalAuth = localStorage.getItem("berakit_admin_auth");
              if (currentLocalAuth !== "true") {
                setAuthenticated(false);
                router.push("/login");
              }
            }
            setLoading(false);
          });
          const subscription = authChangeRes?.data?.subscription;

          if (!session) {
            router.push("/login");
          }
          return () => {
            if (subscription) subscription.unsubscribe();
          };
        } catch (err) {
          console.error("Auth check failed:", err);
          checkLocalFallback();
        }
      } else {
        checkLocalFallback();
      }
    };

    const checkLocalFallback = () => {
      const localAuth = localStorage.getItem("berakit_admin_auth");
      if (localAuth === "true") {
        setAuthenticated(true);
      } else {
        router.push("/login");
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 text-[#6e3ff3] animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <DashboardContent />
        </div>
      </div>
    </SidebarProvider>
  );
}
