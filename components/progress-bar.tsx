"use client"

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProgressBar({ value, max = 100, label, showValue = true, size = "md", className }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-slate-200">{label}</span>}
          {showValue && <span className="text-slate-400">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-white/10 ${sizeClasses[size]}`}>
        <div
          className="h-full rounded-full bg-linear-to-r from-cyan-300 via-sky-300 to-emerald-300 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
