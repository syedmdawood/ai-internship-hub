"use client"

import Link from "next/link"
import { useState } from "react"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  ListTodo,
  TrendingUp,
  Star,
  Search,
  ArrowLeft,
  Brain,
  MoreHorizontal,
  FileText,
  BarChart3,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { adminStats, mentorStudents, tasks } from "@/lib/mock-data"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const userRoleData = [
  { name: "Students", value: adminStats.activeStudents, color: "var(--color-primary)" },
  { name: "Mentors", value: adminStats.mentors, color: "var(--color-accent)" },
  { name: "Inactive", value: adminStats.totalUsers - adminStats.activeStudents - adminStats.mentors, color: "var(--color-muted)" },
]

const monthlyData = [
  { month: "Sep", users: 180, tasks: 45 },
  { month: "Oct", users: 320, tasks: 78 },
  { month: "Nov", users: 510, tasks: 120 },
  { month: "Dec", users: 780, tasks: 165 },
  { month: "Jan", users: 1200, tasks: 230 },
  { month: "Feb", users: 2547, tasks: 350 },
]

export default function AdminPage() {
  const [searchUsers, setSearchUsers] = useState("")
  const [searchTasks, setSearchTasks] = useState("")

  const filteredUsers = mentorStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      s.email.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTasks.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchTasks.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-lg sm:px-6">
        <div className="flex items-center gap-3">
          {/* <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to home</span>
            </Button>
          </Link> */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
            <Brain className="h-5 w-5 text-slate-950" />
          </div>
          <span className="text-lg font-bold text-slate-100">Admin Panel</span>
          <Badge variant="secondary" className="hidden border border-cyan-300/35 bg-cyan-400/10 text-cyan-200 sm:inline-flex">Admin</Badge>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-cyan-300/10 text-cyan-300 text-sm font-medium">AD</AvatarFallback>
        </Avatar>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-4 py-5 shadow-xl shadow-black/20 sm:px-6 sm:py-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl" />
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300 sm:text-base">System overview and management controls.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Users" value={adminStats.totalUsers.toLocaleString()} icon={Users} trend={{ value: 15, positive: true }} />
          <StatsCard title="Total Tasks" value={adminStats.totalTasks} icon={ListTodo} trend={{ value: 8, positive: true }} />
          <StatsCard title="Completion Rate" value={`${adminStats.completionRate}%`} icon={TrendingUp} trend={{ value: 5, positive: true }} />
          <StatsCard title="Satisfaction" value={`${adminStats.avgSatisfaction}/5`} icon={Star} trend={{ value: 2, positive: true }} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-100">
                <BarChart3 className="h-4 w-4 text-cyan-300" />
                Growth Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172acc',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="users" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Users" />
                    <Bar dataKey="tasks" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-slate-100">
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
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {userRoleData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172acc',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#e2e8f0',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-4 sm:gap-6">
                {userRoleData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-300">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap gap-2 bg-slate-900/70 p-1 sm:w-auto">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <CardTitle className="text-base text-slate-100">All Users</CardTitle>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search users..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} className="h-9 border-white/15 bg-slate-900/60 pl-9 text-slate-100 placeholder:text-slate-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">User</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tasks</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-border/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-cyan-300/10 text-cyan-300 text-xs">
                                  {user.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="text-sm font-medium text-slate-100">{user.name}</p>
                                  <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs border border-white/15 bg-slate-800 text-slate-200">{user.domain}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className="text-xs border-white/15 text-slate-200">Student</Badge></TableCell>
                            <TableCell className="text-sm text-slate-100">{user.tasksCompleted}</TableCell>
                            <TableCell className="text-sm font-medium text-slate-100">{user.avgScore}%</TableCell>
                          <TableCell>
                              <Badge variant="outline" className="border-emerald-300/35 bg-emerald-400/10 text-emerald-200 text-xs">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-white/15 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur">
                                <DropdownMenuItem className="focus:bg-white/10">View Profile</DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-white/10">Edit User</DropdownMenuItem>
                                <DropdownMenuItem className="text-rose-300 focus:bg-white/10">Suspend</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <CardTitle className="text-base text-slate-100">All Tasks</CardTitle>
                  <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Search tasks..." value={searchTasks} onChange={(e) => setSearchTasks(e.target.value)} className="h-9 border-white/15 bg-slate-900/60 pl-9 text-slate-100 placeholder:text-slate-400" />
                    </div>
                    <Button size="sm" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Add Task</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Task</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Difficulty</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Points</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id} className="border-border/50">
                          <TableCell className="text-sm font-medium text-slate-100 max-w-50 truncate">{task.title}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs border border-white/15 bg-slate-800 text-slate-200">{task.domain}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              task.difficulty === "Beginner" ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-200" :
                              task.difficulty === "Intermediate" ? "border-amber-300/35 bg-amber-400/10 text-amber-200" :
                              "border-rose-300/35 bg-rose-400/10 text-rose-200"
                            }>{task.difficulty}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-100">{task.points}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              task.status === "available" ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-200" :
                              task.status === "completed" ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-200" :
                              "border-amber-300/35 bg-amber-400/10 text-amber-200"
                            }>{task.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-white/15 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur">
                                <DropdownMenuItem className="focus:bg-white/10">Edit Task</DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-white/10">View Submissions</DropdownMenuItem>
                                <DropdownMenuItem className="text-rose-300 focus:bg-white/10">Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "User Activity Report", description: "Detailed breakdown of user engagement and activity patterns.", icon: Users },
                { title: "Task Completion Report", description: "Analysis of task completion rates across all domains.", icon: ListTodo },
                { title: "Performance Analytics", description: "AI scoring trends and student performance metrics.", icon: TrendingUp },
                { title: "Feedback Summary", description: "Aggregated AI feedback data and common improvement areas.", icon: FileText },
                { title: "Platform Statistics", description: "Overall platform usage, growth metrics, and health indicators.", icon: BarChart3 },
                { title: "Mentor Evaluation", description: "Mentor effectiveness and student satisfaction ratings.", icon: Star },
              ].map((report) => (
                <Card key={report.title} className="cursor-pointer border-white/10 bg-white/4 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10">
                      <report.icon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <h3 className="mt-3 font-semibold text-slate-100">{report.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{report.description}</p>
                    <Button variant="ghost" size="sm" className="mt-3 h-auto p-0 text-cyan-300 hover:bg-transparent hover:text-cyan-200">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
