"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Calendar, Star, ArrowRight } from "lucide-react"

interface TaskCardProps {
  id: string
  title: string
  description: string
  difficulty: string
  domain: string
  deadline: string
  status: string
  points: number
}

const difficultyColors: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
}

const statusColors: Record<string, string> = {
  available: "bg-primary/10 text-primary border-primary/20",
  "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
}

export function TaskCard({ id, title, description, difficulty, domain, deadline, status, points }: TaskCardProps) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={difficultyColors[difficulty]}>
                {difficulty}
              </Badge>
              <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">
                {domain}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            {points} pts
          </span>
        </div>
        <Link href={`/dashboard/tasks/${id}`}>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5">
            View <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
