"use client"

import Link from "next/link"
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
  Beginner: "border-emerald-300/35 bg-emerald-400/10 text-emerald-200",
  Intermediate: "border-amber-300/35 bg-amber-400/10 text-amber-200",
  Advanced: "border-rose-300/35 bg-rose-400/10 text-rose-200",
}

const statusColors: Record<string, string> = {
  available: "border-cyan-300/35 bg-cyan-400/10 text-cyan-200",
  "in-progress": "border-amber-300/35 bg-amber-400/10 text-amber-200",
  completed: "border-emerald-300/35 bg-emerald-400/10 text-emerald-200",
}

export function TaskCard({ id, title, description, difficulty, domain, deadline, status, points }: TaskCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/4 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-xl">
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${difficultyColors[difficulty]}`}>
                {difficulty}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200">
                {domain}
              </span>
            </div>
            <h3 className="leading-tight font-semibold text-slate-100 transition-colors group-hover:text-cyan-300">
              {title}
            </h3>
          </div>
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusColors[status]}`}>
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
      <div className="px-5 pb-3">
        <p className="line-clamp-2 text-sm text-slate-300">{description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-white/10 px-5 pb-4 pt-3">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            {points} pts
          </span>
        </div>
        <Link
          href={`/dashboard/tasks/${id}`}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
        >
          View <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}
