"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import { useDispatch } from "react-redux";
import { logout } from "@/redux/features/authSlice";

import { useRouter } from "next/navigation";

interface AdminNavbarProps {
  onOpenMobileMenu?: () => void;
}

export function AdminNavbar({ onOpenMobileMenu }: AdminNavbarProps) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          full_name,
          avatar_url
          `,
        )
        .eq("id", user.id)
        .single();

      setUserData({
        name: profile?.full_name || user.user_metadata?.full_name || "Admin",

        email: user.email || "",

        avatar: profile?.avatar_url || "",
      });
    }

    loadUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "AD";

    const parts = name.split(" ");

    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    dispatch(logout());

    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-lg px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search tasks, projects..."
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userData.avatar} />

                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 border-white/15 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-100">
                  {userData.name}
                </p>

                <p className="text-xs text-slate-400">{userData.email}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem asChild>
              <Link
                href="/admin/profile"
                className="cursor-pointer text-slate-200 focus:bg-white/10"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/admin/settings"
                className="cursor-pointer text-slate-200 focus:bg-white/10"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-rose-300 focus:bg-white/10"
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
