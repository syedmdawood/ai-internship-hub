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

interface MentorNavbarProps {
  onOpenMobileMenu?: () => void;
}

export function MentorNavbar({ onOpenMobileMenu }: MentorNavbarProps) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [mentorData, setMentorData] = useState({
    name: "",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    async function loadMentor() {
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

      setMentorData({
        name: profile?.full_name || user.user_metadata?.full_name || "Mentor",

        email: user.email || "",

        avatar: profile?.avatar_url || "",
      });
    }

    loadMentor();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "ME";

    return name
      .split(" ")
      .slice(0, 2)
      .map((item) => item[0])
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

          <span className="sr-only">Open menu</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={mentorData.avatar} />

                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(mentorData.name)}
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
                  {mentorData.name}
                </p>

                <p className="text-xs text-slate-400">{mentorData.email}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem asChild>
              <Link
                href="/mentor/settings"
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
