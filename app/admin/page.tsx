"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { StatsCard } from "@/components/stats-card";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Users,
  ListTodo,
  TrendingUp,
  Star,
  Search,
  Brain,
  MoreHorizontal,
  FileText,
  BarChart3,
  Link,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function AdminPage() {
  const [searchUsers, setSearchUsers] = useState("");

  const [searchTasks, setSearchTasks] = useState("");

  const [loadingStats, setLoadingStats] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    mentors: 0,
    admins: 0,
    activeDomains: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageEvaluationScore: 0,
  });

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        const token = sessionData.session?.access_token;

        if (!token) {
          console.log("No session found");
          return;
        }

        const response = await fetch("/api/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          setStats(result.stats);
        } else {
          console.log(result.error);
        }
      } catch (error) {
        console.log("Dashboard error", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadDashboardStats();
  }, []);

  const userRoleData = [
    {
      name: "Students",
      value: stats.students,
      color: "var(--color-primary)",
    },

    {
      name: "Mentors",
      value: stats.mentors,
      color: "var(--color-accent)",
    },

    {
      name: "Admins",
      value: stats.admins,
      color: "var(--color-muted)",
    },
  ];

  const monthlyData = [
    {
      month: "Jan",
      users: stats.totalUsers,
      tasks: stats.totalTasks,
    },

    {
      month: "Current",
      users: stats.totalUsers,
      tasks: stats.completedTasks,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-lg sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
            <Brain className="h-5 w-5 text-slate-950" />
          </div>

          <span className="text-lg font-bold text-slate-100">Admin Panel</span>

          <Badge className="border border-cyan-300/35 bg-cyan-400/10 text-cyan-200">
            Admin
          </Badge>
        </div>

        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-cyan-300/10 text-cyan-300">
            AD
          </AvatarFallback>
        </Avatar>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-4 py-5 shadow-xl shadow-black/20 sm:px-6 sm:py-6">
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>

          <p className="mt-1 text-sm text-slate-300">
            System overview and management controls.
          </p>
        </div>

        {/* REAL DATABASE STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={loadingStats ? "..." : stats.totalUsers.toLocaleString()}
            icon={Users}
          />

          <StatsCard
            title="Students"
            value={loadingStats ? "..." : stats.students}
            icon={Users}
          />

          <StatsCard
            title="Mentors"
            value={loadingStats ? "..." : stats.mentors}
            icon={Star}
          />

          <StatsCard
            title="Total Tasks"
            value={loadingStats ? "..." : stats.totalTasks}
            icon={ListTodo}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/4">
            <CardHeader>
              <CardTitle className="flex gap-2 text-slate-100">
                <BarChart3 className="h-4 w-4 text-cyan-300" />
                Platform Overview
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="users"
                      fill="var(--color-primary)"
                      name="Users"
                    />

                    <Bar
                      dataKey="tasks"
                      fill="var(--color-accent)"
                      name="Tasks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/4">
            <CardHeader>
              <CardTitle className="flex gap-2 text-slate-100">
                <Users className="h-4 w-4 text-cyan-300" />
                User Distribution
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="h-55">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                    >
                      {userRoleData.map((item, index) => (
                        <Cell key={index} fill={item.color} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>

            <TabsTrigger value="tasks">Tasks</TabsTrigger>

            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-white/10 bg-white/4">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  User Management Overview
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {stats.totalUsers}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Students</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {stats.students}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Mentors</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {stats.mentors}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Admins</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {stats.admins}
                    </p>
                  </div>
                </div>

                <Link href="/admin/users">
                  <Button className="mt-3">Manage Users</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="border-white/10 bg-white/4">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Task Management Overview
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Total Tasks</p>

                    <p className="text-2xl font-bold text-slate-100">
                      {stats.totalTasks}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Completed Tasks</p>

                    <p className="text-2xl font-bold text-slate-100">
                      {stats.completedTasks}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-400">Average Score</p>

                    <p className="text-2xl font-bold text-slate-100">
                      {stats.averageEvaluationScore}
                    </p>
                  </div>
                </div>

                <Link href="/admin/tasks">
                  <Button className="mt-3">Manage Tasks</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-white/10 bg-white/4">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Analytics Reports
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  Generate insights from users, tasks, evaluations, and
                  internship performance.
                </p>

                <Link href="/admin/reports">
                  <Button>Open Reports Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
