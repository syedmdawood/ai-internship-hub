"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MentorNavbar } from "@/components/mentor/admin-navbar";
import { MentorSidebar } from "@/components/mentor/mentor-sidebar";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      const user = session.user;
      const role = user.app_metadata?.role;

      const passwordIsSet =
        user.app_metadata?.setPassword ??
        user.app_metadata?.set_password ??
        true;

      if (passwordIsSet === false) {
        router.replace("/create-password");
        return;
      }

      if (role === "admin") {
        router.replace("/admin");
        return;
      }

      if (role !== "mentor") {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Checking mentor authentication...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <MentorSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() =>
          setMobileNavOpen(false)
        }
      />

      <div className="md:ml-64">
        <MentorNavbar
          onOpenMobileMenu={() =>
            setMobileNavOpen(true)
          }
        />

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}