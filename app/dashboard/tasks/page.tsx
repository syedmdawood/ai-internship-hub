"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type RecommendedTask = {
  id: string;
  title: string;
  description: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_minutes: number;
  deliverable_type: "text" | "github_link" | "figma_url" | "document_url";
  instructions: string | null;
  tags: string[] | null;
  recommendation_score: number;
  recommendation_reason: string;
};

type StartedTask = {
  id: string;
  status: string;
  assigned_at: string;
  started_at: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  recommendation_score?: number | null;
  recommendation_reason?: string | null;
  task: {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    estimated_minutes: number;
    deliverable_type: string;
    instructions: string | null;
    tags: string[] | null;
  } | null;
};

type ProfileContext = {
  primary_domain_id: string | null;
  secondary_domain_id: string | null;
  primary_domain_name: string | null;
  secondary_domain_name: string | null;
  skill_level: string | null;
  current_skill_level: string | null;
};

type ProgressSummary = {
  totalAssigned: number;
  inProgress: number;
  completed: number;
};

export default function TasksPage() {
  const router = useRouter();

  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [loadingMyTasks, setLoadingMyTasks] = useState(true);
  const [loadingProfileContext, setLoadingProfileContext] = useState(true);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<RecommendedTask[]>([]);
  const [myTasks, setMyTasks] = useState<StartedTask[]>([]);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) return null;
    return session.access_token;
  }

  async function loadAll() {
    await Promise.all([loadProfileContext(), loadRecommendations(), loadMyTasks()]);
  }

  async function loadProfileContext() {
    try {
      setLoadingProfileContext(true);

      const token = await getAccessToken();
      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const res = await fetch("/api/task/profile-context", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load profile context.");
        return;
      }

      setProfileContext(data.profile || null);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while loading profile context.");
    } finally {
      setLoadingProfileContext(false);
    }
  }

  async function loadRecommendations() {
    try {
      setLoadingRecommendations(true);

      const token = await getAccessToken();
      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const res = await fetch("/api/task/recommend", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsAssessment) {
          toast.error("Please complete your skill assessment first.");
          router.push("/dashboard/assessment");
          return;
        }

        toast.error(data.error || "Failed to load recommendations.");
        return;
      }

      setRecommendations(data.recommendations || []);
      setProgress(data.progress || null);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while loading recommendations.");
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function loadMyTasks() {
    try {
      setLoadingMyTasks(true);

      const token = await getAccessToken();
      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const res = await fetch("/api/task/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load allocated tasks.");
        return;
      }

      setMyTasks(data.tasks || []);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while loading your tasks.");
    } finally {
      setLoadingMyTasks(false);
    }
  }

  async function handleStartTask(taskId: string) {
    try {
      setStartingTaskId(taskId);

      const token = await getAccessToken();
      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const res = await fetch("/api/task/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start task.");
        return;
      }

      toast.success("AI recommended task started successfully.");
      await Promise.all([loadRecommendations(), loadMyTasks()]);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while starting the task.");
    } finally {
      setStartingTaskId(null);
    }
  }

  const resolvedSkillLevel =
    profileContext?.current_skill_level || profileContext?.skill_level || "-";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Task Allocation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks are recommended automatically using your assessment profile,
          skill level, recommended domains, and previous progress.
        </p>
      </div>

      {!loadingProfileContext && profileContext ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-sm font-medium">Primary Recommended Domain</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profileContext.primary_domain_name || "-"}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-sm font-medium">Secondary Recommended Domain</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profileContext.secondary_domain_name || "-"}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-sm font-medium">Current Skill Level</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {resolvedSkillLevel}
            </p>
          </div>
        </section>
      ) : null}

      {progress ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Total Allocated</p>
            <p className="mt-1 text-2xl font-bold">{progress.totalAssigned}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="mt-1 text-2xl font-bold">{progress.inProgress}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-1 text-2xl font-bold">{progress.completed}</p>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">AI Recommended Tasks</h2>
          <p className="text-sm text-muted-foreground">
            The system selects suitable tasks from your recommended domains. You
            do not need to manually choose a domain.
          </p>
        </div>

        {loadingRecommendations ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Loading AI recommendations...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            No recommended tasks found yet. Please make sure active tasks exist
            for your primary or secondary recommended domain.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((task) => (
              <div key={task.id} className="rounded-xl border bg-background p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{task.title}</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {task.difficulty_level}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>

                <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-medium">Estimated Time:</span>{" "}
                    {task.estimated_minutes} minutes
                  </p>

                  <p>
                    <span className="font-medium">Deliverable:</span>{" "}
                    {task.deliverable_type}
                  </p>

                  <p>
                    <span className="font-medium">AI Score:</span>{" "}
                    {task.recommendation_score}/100
                  </p>
                </div>

                {task.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border px-2 py-1 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {task.instructions ? (
                  <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium">Instructions:</span>{" "}
                    {task.instructions}
                  </div>
                ) : null}

                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  {task.recommendation_reason ||
                    "Recommended based on your profile and progress."}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleStartTask(task.id)}
                    disabled={startingTaskId === task.id}
                    className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {startingTaskId === task.id ? "Starting..." : "Start Task"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">My Allocated Tasks</h2>
          <p className="text-sm text-muted-foreground">
            These are the tasks you started from AI recommendations.
          </p>
        </div>

        {loadingMyTasks ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Loading allocated tasks...
          </div>
        ) : myTasks.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            You have not started any recommended task yet.
          </div>
        ) : (
          <div className="space-y-4">
            {myTasks.map((item) => (
              <div key={item.id} className="rounded-xl border bg-background p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{item.task?.title || "Task"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.task?.description || "No description"}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-medium">Difficulty:</span>{" "}
                    {item.task?.difficulty_level || "-"}
                  </p>

                  <p>
                    <span className="font-medium">Estimated Time:</span>{" "}
                    {item.task?.estimated_minutes || "-"} minutes
                  </p>

                  <p>
                    <span className="font-medium">Deliverable:</span>{" "}
                    {item.task?.deliverable_type || "-"}
                  </p>

                  <p>
                    <span className="font-medium">Started At:</span>{" "}
                    {item.started_at ? new Date(item.started_at).toLocaleString() : "-"}
                  </p>
                </div>

                {item.recommendation_score ? (
                  <p className="mt-3 text-sm">
                    <span className="font-medium">AI Score:</span>{" "}
                    {item.recommendation_score}/100
                  </p>
                ) : null}

                {item.recommendation_reason ? (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    {item.recommendation_reason}
                  </div>
                ) : null}

                {item.task?.instructions ? (
                  <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium">Instructions:</span>{" "}
                    {item.task.instructions}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
