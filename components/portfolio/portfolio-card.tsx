import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Github, FileArchive, Award, CheckCircle } from "lucide-react";

export function PortfolioCard({ project }: { project: any }) {
  return (
    <Card className="h-full border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{project.title}</CardTitle>

        <p className="text-sm text-muted-foreground">{project.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Skills */}

        <div>
          <p className="text-sm font-medium mb-2">Skills</p>

          <div className="flex flex-wrap gap-2">
            {project.skills?.map((skill: string) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Scores */}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">AI Score</p>

            <p className="text-xl font-bold">{project.ai_score}%</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Mentor Score</p>

            <p className="text-xl font-bold">{project.mentor_score ?? "-"}%</p>
          </div>
        </div>

        {/* Approval */}

        {project.mentor_approved && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            Mentor Approved
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            className="flex items-center gap-2 text-sm"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        )}

        {project.files?.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <FileArchive className="h-4 w-4" />
            Files Uploaded
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
