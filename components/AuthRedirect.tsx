"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const role = session.user.app_metadata?.role;

      // Only redirect from public pages
      const publicPages = ["/", "/about", "/pricing", "/contact"];

      if (!publicPages.includes(pathname)) return;

      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "mentor") {
        router.replace("/mentor");
      } else {
        router.replace("/dashboard");
      }
    };

    checkUser();
  }, [pathname, router]);

  return null;
}