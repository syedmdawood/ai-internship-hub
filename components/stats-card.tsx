import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    positive: boolean
  }
  className?: string
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xl", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-slate-100">{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trend.positive ? "text-emerald-300" : "text-rose-300")}>
                {trend.positive ? "+" : ""}{trend.value}% from last week
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10">
            <Icon className="h-6 w-6 text-cyan-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
