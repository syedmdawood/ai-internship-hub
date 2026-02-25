import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Award } from "lucide-react"

interface PortfolioCardProps {
  title: string
  domain: string
  score: number
  date: string
  description: string
  tags: string[]
}

export function PortfolioCard({ title, domain, score, date, description, tags }: PortfolioCardProps) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider">{domain}</p>
            <h3 className="font-semibold text-foreground mt-1">{title}</h3>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">{score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </CardContent>
    </Card>
  )
}
