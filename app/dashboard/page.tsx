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
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, Syed</h1>
        <p className="text-muted-foreground mt-1">{"Here's what's happening with your internship progress."}</p>
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
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Internship Progress</CardTitle>
            <Badge variant="secondary" className="text-xs">
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
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalTasks - stats.tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.portfolioProjects}</p>
              <p className="text-xs text-muted-foreground">Portfolio Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.task}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      activity.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : activity.status === "in-progress"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-primary/10 text-primary border-primary/20"
                    }
                  >
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended Tasks</h2>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedTasks.map((task) => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      </div>
    </div>
  )
}
