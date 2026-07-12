"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { Button } from "@/components/ui/button";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.log("No active session");

          setLoading(false);

          return;
        }

        const res = await fetch("/api/student/portfolio", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await res.json();

        console.log("Portfolio API Response:", data);

        setPortfolio(data);
      } catch (error) {
        console.log("Portfolio error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  if (loading) {
    return <div>Loading portfolio...</div>;
  }

  if (!portfolio) {
    return <div>Unable to load portfolio</div>;
  }

  async function generatePortfolio() {
    try {
      setGenerating(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("No session");

        return;
      }

      const res = await fetch("/api/student/portfolio/generate", {
        method: "POST",

        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      console.log("AI Portfolio Result:", data);

      if (data.success) {

  console.log(
    "AI generation completed successfully"
  );

}
    } catch (error) {
      console.log("Generate error:", error);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Portfolio</h1>

          <p className="text-muted-foreground mt-1">
            Your professional showcase powered by AI evaluation and mentor
            feedback.
          </p>
        </div>

        <Button onClick={generatePortfolio} disabled={generating}>
          {generating ? "Generating..." : "Generate AI Portfolio"}
        </Button>
      </div>

      {/* Portfolio Header */}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold">{portfolio.profile?.name}</h2>

          <p className="text-primary font-medium mt-1">
            {portfolio.profile?.primary_domain}
          </p>

          <p className="text-muted-foreground mt-2">
            {portfolio.profile?.bio ??
              "Build your professional portfolio from completed internship projects."}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {portfolio.profile?.skills?.map((skill: string) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects */}

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>

        <CardContent>
          {!portfolio.projects || portfolio.projects.length === 0 ? (
            <p className="text-muted-foreground">No completed projects yet.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {portfolio.projects.map((project: any) => (
                <PortfolioCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
