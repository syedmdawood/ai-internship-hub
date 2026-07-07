"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const FINAL_STATUSES = [
  "submitted",
  "under_review",
  "reviewed",
  "completed",
  "approved",
  "expired",
  "finished",
  "cancelled",
];

function normalizeStatus(status: string | null | undefined) {
  return (status || "").toLowerCase().replace(/\s+/g, "_");
}

function isFinalStatus(status: string | null | undefined) {
  return FINAL_STATUSES.includes(normalizeStatus(status));
}

function getTaskDeadlineMs(item: StartedTask) {
  if (!item.started_at || !item.task?.estimated_minutes) return null;

  const startedMs = new Date(item.started_at).getTime();
  if (Number.isNaN(startedMs)) return null;

  return startedMs + item.task.estimated_minutes * 60 * 1000;
}

function isTaskExpired(item: StartedTask, now: number) {
  if (!item.started_at || isFinalStatus(item.status)) return false;

  const deadlineMs = getTaskDeadlineMs(item);
  if (!deadlineMs) return false;

  return now >= deadlineMs;
}

function isTaskActive(item: StartedTask, now: number) {
  if (!item.started_at) return false;
  if (isFinalStatus(item.status)) return false;
  if (isTaskExpired(item, now)) return false;

  return true;
}

function formatRemainingTime(ms: number) {
  if (ms <= 0) return "Time over";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function getRemainingText(item: StartedTask, now: number) {
  const deadlineMs = getTaskDeadlineMs(item);
  if (!deadlineMs) return "-";

  return formatRemainingTime(deadlineMs - now);
}

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
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadAll();

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const activeTask = useMemo(() => {
    return myTasks.find((item) => isTaskActive(item, now)) || null;
  }, [myTasks, now]);

  const allocatedTaskMap = useMemo(() => {
    const map = new Map<string, StartedTask>();

    myTasks.forEach((item) => {
      if (item.task?.id) {
        map.set(item.task.id, item);
      }
    });

    return map;
  }, [myTasks]);

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) return null;
    return session.access_token;
  }

  async function loadAll() {
    const token = await getAccessToken();

    if (!token) {
      toast.error("You are not logged in.");
      return;
    }

    await Promise.all([
      loadProfileContext(token),
      loadRecommendations(token),
      loadMyTasks(token),
    ]);
  }

  async function loadProfileContext(token: string) {
    try {
      setLoadingProfileContext(true);

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

  async function loadRecommendations(token: string) {
    try {
      setLoadingRecommendations(true);

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

  async function loadMyTasks(token: string) {
    try {
      setLoadingMyTasks(true);

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
      if (activeTask) {
        toast.error("You already have one task in progress. Submit it or wait until it expires.");
        return;
      }

      const alreadyAllocated = allocatedTaskMap.get(taskId);

      if (alreadyAllocated) {
        toast.error("This task is already allocated to you.");
        return;
      }

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

      toast.success("Task started successfully.");

      await Promise.all([loadRecommendations(token), loadMyTasks(token)]);
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

      {activeTask ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">You already have one task in progress.</p>
          <p className="mt-1">
            Current Task: {activeTask.task?.title || "Task"} | Remaining Time:{" "}
            <span className="font-semibold">{getRemainingText(activeTask, now)}</span>
          </p>
        </div>
      ) : null}

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
            The system selects suitable tasks from your recommended domains.
            You can start only one task at a time.
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
            {recommendations.map((task) => {
              const allocatedTask = allocatedTaskMap.get(task.id);
              const allocatedExpired = allocatedTask
                ? isTaskExpired(allocatedTask, now)
                : false;

              const disableStart =
                Boolean(startingTaskId) ||
                Boolean(activeTask) ||
                Boolean(allocatedTask);

              let buttonText = "Start Task";

              if (startingTaskId === task.id) {
                buttonText = "Starting...";
              } else if (allocatedTask && allocatedExpired) {
                buttonText = "Time Expired";
              } else if (allocatedTask) {
                buttonText = "Already Started";
              } else if (activeTask) {
                buttonText = "Another Task In Progress";
              }

              return (
                <div
                  key={task.id}
                  className="rounded-xl border bg-background p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold">{task.title}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {task.difficulty_level}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>

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
                      disabled={disableStart}
                      className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
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
            {myTasks.map((item) => {
              const expired = isTaskExpired(item, now);
              const active = isTaskActive(item, now);
              const remainingText = getRemainingText(item, now);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border bg-background p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">
                        {item.task?.title || "Task"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.task?.description || "No description"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={
                          expired
                            ? "rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                            : active
                            ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {expired ? "expired" : item.status}
                      </span>

                      {item.started_at ? (
                        <p
                          className={
                            expired
                              ? "mt-2 text-xs font-medium text-red-600"
                              : "mt-2 text-xs font-medium text-amber-700"
                          }
                        >
                          {expired ? "Time over" : `Remaining: ${remainingText}`}
                        </p>
                      ) : null}
                    </div>
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
                      {item.started_at
                        ? new Date(item.started_at).toLocaleString()
                        : "-"}
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

                  {active ? (
                    <div className="mt-4 flex justify-end">
                      <Link href="/dashboard/submit">
                        <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                          Submit Work
                        </button>
                      </Link>
                    </div>
                  ) : expired ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Submission time is over. This task cannot be submitted now.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}