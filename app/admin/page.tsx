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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-lg px-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to home</span>
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
          <Badge variant="secondary">Admin</Badge>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">AD</AvatarFallback>
        </Avatar>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management controls.</p>
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
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Growth Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Bar dataKey="users" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Users" />
                    <Bar dataKey="tasks" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
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
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {userRoleData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">All Users</CardTitle>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} className="pl-9 h-9" />
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
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {user.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{user.domain}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">Student</Badge></TableCell>
                          <TableCell className="text-sm text-foreground">{user.tasksCompleted}</TableCell>
                          <TableCell className="text-sm font-medium text-foreground">{user.avgScore}%</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
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
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">All Tasks</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search tasks..." value={searchTasks} onChange={(e) => setSearchTasks(e.target.value)} className="pl-9 h-9" />
                    </div>
                    <Button size="sm">Add Task</Button>
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
                          <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">{task.title}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{task.domain}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              task.difficulty === "Beginner" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                              task.difficulty === "Intermediate" ? "bg-amber-100 text-amber-700 border-amber-200" :
                              "bg-red-100 text-red-700 border-red-200"
                            }>{task.difficulty}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-foreground">{task.points}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              task.status === "available" ? "bg-primary/10 text-primary border-primary/20" :
                              task.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                              "bg-amber-100 text-amber-700 border-amber-200"
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
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                <DropdownMenuItem>View Submissions</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
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
                <Card key={report.title} className="border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-3 font-semibold text-foreground">{report.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                    <Button variant="ghost" size="sm" className="mt-3 text-primary p-0 h-auto">
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
