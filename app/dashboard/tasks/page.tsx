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
  selected_task_domain_id: string | null;
  primary_domain_name: string | null;
  secondary_domain_name: string | null;
  selected_task_domain_name: string | null;
  skill_level: string | null;
  current_skill_level: string | null;
};

export default function TasksPage() {
  const router = useRouter();

  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [loadingMyTasks, setLoadingMyTasks] = useState(true);
  const [loadingProfileContext, setLoadingProfileContext] = useState(true);
  const [selectingDomain, setSelectingDomain] = useState(false);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<RecommendedTask[]>([]);
  const [myTasks, setMyTasks] = useState<StartedTask[]>([]);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);
  const [needsDomainSelection, setNeedsDomainSelection] = useState(false);

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

      setNeedsDomainSelection(Boolean(data.needsDomainSelection));
      setRecommendations(data.recommendations || []);
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
        toast.error(data.error || "Failed to load started tasks.");
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

  async function handleSelectDomain(domainId: string) {
    try {
      setSelectingDomain(true);

      const token = await getAccessToken();
      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const res = await fetch("/api/task/select-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to select domain.");
        return;
      }

      toast.success("Domain selected successfully.");
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while selecting domain.");
    } finally {
      setSelectingDomain(false);
    }
  }

  async function handleStartTask(task: RecommendedTask) {
    try {
      setStartingTaskId(task.id);

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
        body: JSON.stringify({
          taskId: task.id,
          recommendationScore: task.recommendation_score,
          recommendationReason: task.recommendation_reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start task.");
        return;
      }

      toast.success("Task started successfully.");
      await loadRecommendations();
      await loadMyTasks();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while starting the task.");
    } finally {
      setStartingTaskId(null);
    }
  }

  const showDomainSelection =
    !loadingProfileContext &&
    !loadingRecommendations &&
    profileContext &&
    !profileContext.selected_task_domain_id &&
    needsDomainSelection;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Internship Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete assessment first, choose a recommended domain, then start internship tasks based on your profile.
        </p>
      </div>

      {profileContext?.selected_task_domain_name ? (
        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="text-sm">
            <span className="font-semibold">Selected Domain:</span>{" "}
            {profileContext.selected_task_domain_name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks below are filtered according to your chosen recommended domain.
          </p>
        </div>
      ) : null}

      {showDomainSelection ? (
        <section className="space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="text-lg font-semibold">Choose Your Internship Domain</h2>
            <p className="text-sm text-muted-foreground">
              These domains were recommended from your skill assessment. Select one to unlock related tasks.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {profileContext.primary_domain_id && profileContext.primary_domain_name ? (
              <button
                onClick={() => handleSelectDomain(profileContext.primary_domain_id!)}
                disabled={selectingDomain}
                className="rounded-xl border p-5 text-left transition hover:border-primary"
              >
                <p className="text-sm text-muted-foreground">Primary Recommended Domain</p>
                <h3 className="mt-1 text-lg font-semibold">{profileContext.primary_domain_name}</h3>
              </button>
            ) : null}

            {profileContext.secondary_domain_id && profileContext.secondary_domain_name ? (
              <button
                onClick={() => handleSelectDomain(profileContext.secondary_domain_id!)}
                disabled={selectingDomain}
                className="rounded-xl border p-5 text-left transition hover:border-primary"
              >
                <p className="text-sm text-muted-foreground">Secondary Recommended Domain</p>
                <h3 className="mt-1 text-lg font-semibold">{profileContext.secondary_domain_name}</h3>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {!showDomainSelection ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recommended Tasks</h2>
            <p className="text-sm text-muted-foreground">
              These tasks match your selected domain and current skill level.
            </p>
          </div>

          {loadingRecommendations ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              Loading recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              No recommended tasks found for your selected domain yet.
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

                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Estimated Time:</span> {task.estimated_minutes} minutes
                    </p>
                    <p>
                      <span className="font-medium">Deliverable:</span> {task.deliverable_type}
                    </p>
                    <p>
                      <span className="font-medium">Recommendation Score:</span> {task.recommendation_score}
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
                      <span className="font-medium">Instructions:</span> {task.instructions}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    {task.recommendation_reason || "Recommended for your profile"}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleStartTask(task)}
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
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">My Started Tasks</h2>
          <p className="text-sm text-muted-foreground">
            These are the tasks you have already started.
          </p>
        </div>

        {loadingMyTasks ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Loading started tasks...
          </div>
        ) : myTasks.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            You have not started any tasks yet.
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
                    <span className="font-medium">Difficulty:</span> {item.task?.difficulty_level || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Estimated Time:</span> {item.task?.estimated_minutes || "-"} minutes
                  </p>
                  <p>
                    <span className="font-medium">Deliverable:</span> {item.task?.deliverable_type || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Started At:</span>{" "}
                    {item.started_at ? new Date(item.started_at).toLocaleString() : "-"}
                  </p>
                </div>

                {item.task?.instructions ? (
                  <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium">Instructions:</span> {item.task.instructions}
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