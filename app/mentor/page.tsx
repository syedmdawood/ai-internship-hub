"use client"

import Link from "next/link"
import { useState } from "react"
import { StatsCard } from "@/components/stats-card"
import { ProgressBar } from "@/components/progress-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, Award, Search, MessageSquare, Brain, ArrowLeft } from "lucide-react"
import { mentorStudents } from "@/lib/mock-data"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const chartData = mentorStudents.map((s) => ({
  name: s.name.split(" ")[0],
  score: s.avgScore,
  progress: s.progress,
}))

export default function MentorPage() {
  const [search, setSearch] = useState("")
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>("")

  const filtered = mentorStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.domain.toLowerCase().includes(search.toLowerCase())
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
          <span className="text-lg font-bold text-foreground">Mentor Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">MT</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track student progress and provide feedback.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Students"
            value={mentorStudents.length}
            icon={Users}
            trend={{ value: 8, positive: true }}
          />
          <StatsCard
            title="Average Score"
            value="83%"
            icon={TrendingUp}
            trend={{ value: 3, positive: true }}
          />
          <StatsCard
            title="Top Performer"
            value="Sam Kim"
            subtitle="91% average score"
            icon={Award}
          />
        </div>

        {/* Performance Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Student Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} />
                  <YAxis className="text-xs" tick={{ fill: 'var(--color-muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Avg Score" />
                  <Bar dataKey="progress" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Progress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">Students</CardTitle>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Student</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Progress</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tasks</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Score</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Active</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <TableRow key={student.id} className="border-border/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {student.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{student.domain}</Badge>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <ProgressBar value={student.progress} showValue size="sm" />
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{student.tasksCompleted}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            student.avgScore >= 85
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : student.avgScore >= 75
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }
                        >
                          {student.avgScore}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.lastActive}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student.name)
                            setFeedbackOpen(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Feedback
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>Provide feedback to {selectedStudent}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="feedback-subject">Subject</Label>
              <Input id="feedback-subject" placeholder="e.g., Task Review" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea id="feedback-message" placeholder="Write your feedback..." className="min-h-[120px]" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={() => setFeedbackOpen(false)}>Send Feedback</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
