"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, Code, X, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SubmitPage() {
  const [files, setFiles] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const handleFileAdd = () => {
    setFiles((prev) => [...prev, `project-file-${prev.length + 1}.zip`])
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Submission Received!</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your work has been submitted successfully. AI evaluation is in progress. You will receive feedback shortly.
        </p>
        <Badge variant="outline" className="mt-4 bg-amber-100 text-amber-700 border-amber-200">
          Under Review
        </Badge>
        <div className="flex gap-3 mt-8">
          <Link href="/dashboard/feedback">
            <Button>View Feedback</Button>
          </Link>
          <Link href="/dashboard/tasks">
            <Button variant="outline">Browse Tasks</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to tasks</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit Work</h1>
          <p className="text-muted-foreground mt-1">Build a Responsive Landing Page</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={handleFileAdd}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleFileAdd()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-2 text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">ZIP, PDF, PNG, JPG up to 10MB</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{file}</span>
                      </div>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${file}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Editor Placeholder */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code Snippet (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-foreground/5 border border-border/50 p-4 font-mono text-sm min-h-[200px]">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground text-xs">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2">index.html</span>
                </div>
                <Textarea
                  placeholder="Paste your code here..."
                  className={cn("font-mono text-sm border-0 bg-transparent p-0 shadow-none resize-none focus-visible:ring-0 min-h-[160px]")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your approach, challenges faced, or any notes for the reviewer..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Submission Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "All requirements addressed",
                "Code is clean and documented",
                "Files are properly organized",
                "Tested across browsers",
                "Mobile responsive",
              ].map((item) => (
                <label key={item} className="flex items-center gap-3 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-border accent-primary" />
                  {item}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Project URL (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="url" className="sr-only">Project URL</Label>
              <Input id="url" placeholder="https://your-project.vercel.app" />
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={() => setSubmitted(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  )
}
