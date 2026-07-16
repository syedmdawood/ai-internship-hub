"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import { StatsCard } from "@/components/stats-card";
import { TaskCard } from "@/components/task-card";
import { ProgressBar } from "@/components/progress-bar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  CheckCircle2,
  Clock,
  Star,
  Flame,
  Trophy,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) return;

        const res = await fetch("/api/student/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setDashboard(data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-10 text-slate-300">Loading dashboard...</div>;
  }

  const stats = dashboard?.stats || {};

  const recentActivity = dashboard?.recentActivity || [];

  const recommendedTasks = dashboard?.recommendedTasks || [];

  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -left-28 top-2 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="pointer-events-none absolute -right-24 top-24 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

      {/* Welcome */}

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-4 py-5 shadow-xl shadow-black/20 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl" />

        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
          Welcome back, {dashboard?.profile?.name || "Student"}
        </h1>

        <p className="mt-1 text-sm text-slate-300 sm:text-base">
          Here's what's happening with your internship progress.
        </p>
      </div>

      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tasks Completed"
          value={`${stats.completedTasks || 0}/${stats.totalTasks || 0}`}
          icon={CheckCircle2}
        />

        <StatsCard
          title="Average Score"
          value={`${stats.averageScore || 0}%`}
          icon={Star}
        />

        <StatsCard
          title="Hours Logged"
          value={`${stats.hoursLogged || 0} hrs`}
          icon={Clock}
        />

        <StatsCard
          title="Current Streak"
          value={`${stats.currentStreak || 0} days`}
          icon={Flame}
        />
      </div>

      {/* Progress */}

      <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-slate-100">
              Internship Progress
            </CardTitle>

            <Badge
              variant="secondary"
              className="w-fit border border-amber-300/35 bg-amber-400/10 text-xs text-amber-200"
            >
              <Trophy className="mr-1 h-3 w-3" />
              Level {Math.max(1, Math.ceil((stats.completedTasks || 0) / 5))}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <ProgressBar
            value={stats.completedTasks || 0}
            max={stats.totalTasks || 1}
            label="Overall Completion"
            size="lg"
          />

          <div className="mt-4 grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 py-3">
              <p className="text-2xl font-bold text-slate-100">
                {stats.completedTasks || 0}
              </p>

              <p className="text-xs text-slate-300">Completed</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/50 py-3">
              <p className="text-2xl font-bold text-slate-100">
                {(stats.totalTasks || 0) - (stats.completedTasks || 0)}
              </p>

              <p className="text-xs text-slate-300">Remaining</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/50 py-3">
              <p className="text-2xl font-bold text-slate-100">
                {stats.portfolioProjects || 0}
              </p>

              <p className="text-xs text-slate-300">Portfolio Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
