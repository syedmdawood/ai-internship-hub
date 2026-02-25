"use client"

import { useState } from "react"
import { TaskCard } from "@/components/task-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { tasks } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const domains = ["All", "Web Development", "UI/UX Design", "Content Writing", "Backend Development", "Graphic Design", "Data Science"]
const difficulties = ["All", "Beginner", "Intermediate", "Advanced"]

export default function TasksPage() {
  const [search, setSearch] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase())
    const matchesDomain = selectedDomain === "All" || task.domain === selectedDomain
    const matchesDifficulty = selectedDifficulty === "All" || task.difficulty === selectedDifficulty
    return matchesSearch && matchesDomain && matchesDifficulty
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground mt-1">Browse and start freelancing tasks tailored to your skill level.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Domain</p>
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedDomain === domain
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedDifficulty === diff
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
        <Badge variant="secondary">{filteredTasks.filter(t => t.status === "available").length} available</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} {...task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No tasks found matching your filters.</p>
        </div>
      )}
    </div>
  )
}
