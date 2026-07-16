"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Bell, Search, LogOut, User, Settings, Menu } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface DashboardNavbarProps {
  onOpenMobileMenu?: () => void;
}

export function DashboardNavbar({ onOpenMobileMenu }: DashboardNavbarProps) {
  const router = useRouter();

  const [userName, setUserName] = useState("Student");

  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserEmail(user.email || "");

      // Get name from profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!error && profile?.full_name) {
        setUserName(profile.full_name);
      } else {
        setUserName("Student");
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/");
  };

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />

          <span className="sr-only">Open menu</span>
        </Button>

        <div className="relative max-w-md w-full hidden md:block">


        </div>
      </div>

      <div className="flex items-center gap-3">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials || "ST"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72 border-white/15 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 max-w-full">
                <p
                  className="text-sm font-medium text-slate-100 truncate"
                  title={userName}
                >
                  {userName}
                </p>

                <p
                  className="text-xs text-slate-400 truncate"
                  title={userEmail}
                >
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="cursor-pointer text-slate-200 focus:bg-white/10 focus:text-slate-100"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="cursor-pointer text-slate-200 focus:bg-white/10 focus:text-slate-100"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-rose-300 focus:bg-white/10 focus:text-rose-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
