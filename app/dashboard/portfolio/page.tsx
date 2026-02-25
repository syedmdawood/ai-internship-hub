import { PortfolioCard } from "@/components/portfolio-card"
import { ProgressBar } from "@/components/progress-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Download, ExternalLink, MapPin, Calendar, Award } from "lucide-react"
import { portfolioProjects, skills, stats } from "@/lib/mock-data"

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
          <p className="text-muted-foreground mt-1">Your professional showcase powered by AI-scored projects.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="h-24 bg-primary/10" />
        <CardContent className="relative pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">John Doe</h2>
              <p className="text-sm text-muted-foreground">Full-Stack Web Developer</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Remote
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Joined Jan 2026
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3" /> Avg. Score: {stats.averageScore}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.tasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.portfolioProjects}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stats.averageScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Projects</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolioProjects.map((project) => (
                <PortfolioCard key={project.id} {...project} />
              ))}
            </div>
          </div>
        </div>

        {/* Skills Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill) => (
                <ProgressBar
                  key={skill.name}
                  value={skill.level}
                  label={skill.name}
                  size="sm"
                />
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Fast Learner",
                  "Top Performer",
                  "5-Day Streak",
                  "First Submission",
                  "Code Master",
                  "Design Pro",
                ].map((badge) => (
                  <Badge key={badge} variant="secondary" className="px-3 py-1">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
