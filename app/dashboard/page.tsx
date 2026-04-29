"use client"

import Link from "next/link"
import { StatsCard } from "@/components/stats-card"
import { TaskCard } from "@/components/task-card"
import { ProgressBar } from "@/components/progress-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Star, Flame, Trophy, ArrowRight } from "lucide-react"
import { stats, tasks, recentActivity } from "@/lib/mock-data"

export default function DashboardPage() {
  const recommendedTasks = tasks.filter((t) => t.status === "available").slice(0, 3)

  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -left-28 top-2 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-4 py-5 shadow-xl shadow-black/20 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl" />
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Welcome back, Syed</h1>
        <p className="mt-1 text-sm text-slate-300 sm:text-base">{"Here's what's happening with your internship progress."}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tasks Completed"
          value={`${stats.tasksCompleted}/${stats.totalTasks}`}
          icon={CheckCircle2}
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={Star}
          trend={{ value: 5, positive: true }}
        />
        <StatsCard
          title="Hours Logged"
          value={stats.hoursLogged}
          icon={Clock}
          subtitle="This month"
        />
        <StatsCard
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          icon={Flame}
          trend={{ value: 2, positive: true }}
        />
      </div>

      {/* Progress */}
      <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-slate-100">Internship Progress</CardTitle>
            <Badge variant="secondary" className="w-fit border border-amber-300/35 bg-amber-400/10 text-xs text-amber-200">
              <Trophy className="mr-1 h-3 w-3" /> Level 3
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressBar
            value={stats.tasksCompleted}
            max={stats.totalTasks}
            label="Overall Completion"
            size="lg"
          />
          <div className="mt-4 grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 py-3">
              <p className="text-2xl font-bold text-slate-100">{stats.tasksCompleted}</p>
              <p className="text-xs text-slate-300">Completed</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 py-3">
              <p className="text-2xl font-bold text-slate-100">{stats.totalTasks - stats.tasksCompleted}</p>
              <p className="text-xs text-slate-300">Remaining</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 py-3">
              <p className="text-2xl font-bold text-slate-100">{stats.portfolioProjects}</p>
              <p className="text-xs text-slate-300">Portfolio Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-100">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10">
                    <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{activity.action}</p>
                    <p className="truncate text-xs text-slate-300">{activity.task}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end sm:shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      activity.status === "completed"
                        ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-200"
                        : activity.status === "in-progress"
                        ? "border-amber-300/35 bg-amber-400/10 text-amber-200"
                        : "border-cyan-300/35 bg-cyan-400/10 text-cyan-200"
                    }
                  >
                    {activity.status}
                  </Badge>
                  <span className="whitespace-nowrap text-xs text-slate-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Tasks */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Recommended Tasks</h2>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm" className="text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendedTasks.map((task) => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      </div>
    </div>
  )
}
