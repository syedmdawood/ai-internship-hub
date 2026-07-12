"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type EvaluationType = "code" | "writing" | "design" | "general";

type DomainOption = {
  id: string;
  name: string;
  slug?: string | null;
  display_order?: number;
};

type RecommendedTask = {
  id: string;
  title: string;
  description: string;

  difficulty_level: "beginner" | "intermediate" | "advanced";

  estimated_minutes: number;

  deliverable_type:
    | "text"
    | "code_files"
    | "github_link"
    | "figma_url"
    | "document_url"
    | string;

  evaluation_type?: EvaluationType | null;
  evaluation_criteria?: unknown;

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
    evaluation_type?: EvaluationType | null;
    evaluation_criteria?: unknown;
    instructions: string | null;
    tags: string[] | null;
  } | null;
};

type ProfileContext = {
  /*
   * Latest AI recommendation.
   */
  ai_primary_domain_name: string | null;
  ai_secondary_domain_names: string[];

  /*
   * Current draft or confirmed selection.
   */
  primary_domain_id: string | null;
  secondary_domain_id: string | null;

  primary_domain_name: string | null;
  secondary_domain_name: string | null;

  /*
   * Confirmation information.
   */
  task_domains_confirmed: boolean;

  domain_selection_source: "ai" | "custom" | null;

  domain_selection_updated_at: string | null;

  /*
   * Assessment information.
   */
  skill_level: string | null;
  last_assessment_at: string | null;
  has_assessment: boolean;
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

const FEEDBACK_STATUSES = ["reviewed", "completed", "approved", "evaluated"];

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isFinalStatus(status: string | null | undefined) {
  return FINAL_STATUSES.includes(normalizeStatus(status));
}

function canViewFeedback(status: string | null | undefined) {
  return FEEDBACK_STATUSES.includes(normalizeStatus(status));
}

function getTaskDeadlineMs(item: StartedTask) {
  if (!item.started_at || !item.task?.estimated_minutes) {
    return null;
  }

  const startedMs = new Date(item.started_at).getTime();

  if (Number.isNaN(startedMs)) {
    return null;
  }

  return startedMs + item.task.estimated_minutes * 60 * 1000;
}

function isTaskExpired(item: StartedTask, now: number) {
  if (!item.started_at || isFinalStatus(item.status)) {
    return false;
  }

  const deadlineMs = getTaskDeadlineMs(item);

  if (!deadlineMs) {
    return false;
  }

  return now >= deadlineMs;
}

function isTaskActive(item: StartedTask, now: number) {
  if (!item.started_at) {
    return false;
  }

  if (isFinalStatus(item.status)) {
    return false;
  }

  if (isTaskExpired(item, now)) {
    return false;
  }

  return true;
}

function formatRemainingTime(ms: number) {
  if (ms <= 0) {
    return "Time over";
  }

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

  if (!deadlineMs) {
    return "-";
  }

  return formatRemainingTime(deadlineMs - now);
}

function formatDeliverableType(
  deliverableType: string | null | undefined,
  evaluationType?: EvaluationType | null,
) {
  const value = String(deliverableType ?? "").toLowerCase();

  if (
    evaluationType === "code" ||
    value === "code_files" ||
    value === "github_link"
  ) {
    return "Structured Code Files";
  }

  if (value === "figma_url") {
    return "Figma / Screenshot";
  }

  if (value === "document_url") {
    return "Document / Project URL";
  }

  if (value === "text") {
    return "Written Text";
  }

  return deliverableType || "-";
}

function normalizeName(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function findDomainIdByName(
  domainName: string | null | undefined,
  domains: DomainOption[],
) {
  const normalized = normalizeName(domainName);

  if (!normalized) {
    return "";
  }

  return (
    domains.find((domain) => normalizeName(domain.name) === normalized)?.id ??
    ""
  );
}

export default function TasksPage() {
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [loadingMyTasks, setLoadingMyTasks] = useState(true);

  const [loadingProfileContext, setLoadingProfileContext] = useState(true);

  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const [savingDomains, setSavingDomains] = useState(false);

  const [recommendations, setRecommendations] = useState<RecommendedTask[]>([]);

  const [myTasks, setMyTasks] = useState<StartedTask[]>([]);

  const [profileContext, setProfileContext] = useState<ProfileContext | null>(
    null,
  );

  const [domains, setDomains] = useState<DomainOption[]>([]);

  const [selectedPrimaryDomainId, setSelectedPrimaryDomainId] = useState("");

  const [selectedSecondaryDomainId, setSelectedSecondaryDomainId] =
    useState("");

  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadAll();

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const activeTask = useMemo(() => {
    return myTasks.find((item) => isTaskActive(item, now)) ?? null;
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

    if (error || !session?.access_token) {
      return null;
    }

    return session.access_token;
  }

  async function loadAll() {
    const token = await getAccessToken();

    if (!token) {
      toast.error("You are not logged in.");

      setLoadingProfileContext(false);
      setLoadingMyTasks(false);
      setLoadingRecommendations(false);

      return;
    }

    /*
     * First load profile context.
     * Recommendation loading depends on confirmation status.
     */
    const context = await loadProfileContext(token);

    /*
     * Existing allocated tasks must always load,
     * even if the student has not confirmed new domains.
     */
    await loadMyTasks(token);

    if (context?.task_domains_confirmed) {
      await loadRecommendations(token);
    } else {
      setRecommendations([]);
      setProgress(null);
      setLoadingRecommendations(false);
    }
  }

  async function loadProfileContext(
    token: string,
  ): Promise<ProfileContext | null> {
    try {
      setLoadingProfileContext(true);

      const response = await fetch("/api/task/profile-context", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to load profile context.");

        return null;
      }

      const context = (result.profile as ProfileContext) ?? null;

      const domainOptions = (result.domains as DomainOption[]) ?? [];

      setProfileContext(context);
      setDomains(domainOptions);

      /*
       * Preselect the current draft or confirmed IDs.
       *
       * Immediately after assessment, these IDs contain
       * the initial AI suggestion.
       */
      setSelectedPrimaryDomainId(context?.primary_domain_id ?? "");

      setSelectedSecondaryDomainId(context?.secondary_domain_id ?? "");

      return context;
    } catch (error) {
      console.error("loadProfileContext error:", error);

      toast.error("Something went wrong while loading profile context.");

      return null;
    } finally {
      setLoadingProfileContext(false);
    }
  }

  async function loadRecommendations(token: string) {
    try {
      setLoadingRecommendations(true);

      const response = await fetch("/api/task/recommend", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needsDomainSelection) {
          setRecommendations([]);
          setProgress(null);
          return;
        }

        if (result.needsAssessment) {
          setRecommendations([]);
          setProgress(null);

          toast.error("Please complete your skill assessment first.");

          return;
        }

        toast.error(result.error || "Failed to load recommendations.");

        return;
      }

      setRecommendations(result.recommendations ?? []);

      setProgress(result.progress ?? null);
    } catch (error) {
      console.error("loadRecommendations error:", error);

      toast.error("Something went wrong while loading recommendations.");
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function loadMyTasks(token: string) {
    try {
      setLoadingMyTasks(true);

      const response = await fetch("/api/task/my-tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to load allocated tasks.");

        return;
      }

      setMyTasks(result.tasks ?? []);
    } catch (error) {
      console.error("loadMyTasks error:", error);

      toast.error("Something went wrong while loading your tasks.");
    } finally {
      setLoadingMyTasks(false);
    }
  }

  async function saveDomainSelection(
    primaryDomainId: string,
    secondaryDomainId: string,
  ) {
    if (!primaryDomainId) {
      toast.error("Please select a primary domain.");

      return;
    }

    if (!secondaryDomainId) {
      toast.error("Please select a secondary domain.");

      return;
    }

    if (primaryDomainId === secondaryDomainId) {
      toast.error("Primary and secondary domains must be different.");

      return;
    }

    try {
      setSavingDomains(true);

      const token = await getAccessToken();

      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const response = await fetch("/api/task/domain-selection", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          primaryDomainId,
          secondaryDomainId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needsAssessment) {
          toast.error("Please complete the assessment first.");

          return;
        }

        if (result.domainsAlreadyConfirmed) {
          toast.error(
            "Your task domains have already been confirmed and cannot be changed.",
          );

          await loadProfileContext(token);
          return;
        }

        toast.error(result.error || "Failed to save domain selection.");

        return;
      }

      toast.success(result.message);

      /*
       * Reload profile first so the UI shows confirmed values.
       */
      const updatedContext = await loadProfileContext(token);

      /*
       * Recommendations are only loaded after confirmation.
       */
      if (updatedContext?.task_domains_confirmed) {
        await loadRecommendations(token);
      }
    } catch (error) {
      console.error("saveDomainSelection error:", error);

      toast.error("Something went wrong while saving your domains.");
    } finally {
      setSavingDomains(false);
    }
  }

  async function handleUseAiRecommendations() {
    if (!profileContext) {
      return;
    }

    const aiPrimaryDomainId = findDomainIdByName(
      profileContext.ai_primary_domain_name,
      domains,
    );

    /*
     * The profile currently supports one secondary domain ID.
     * Therefore, use the first AI secondary recommendation.
     */
    const aiSecondaryDomainName =
      profileContext.ai_secondary_domain_names?.[0] ?? null;

    const aiSecondaryDomainId = findDomainIdByName(
      aiSecondaryDomainName,
      domains,
    );

    if (!aiPrimaryDomainId) {
      toast.error("The AI-recommended primary domain is not available.");

      return;
    }

    if (!aiSecondaryDomainId) {
      toast.error(
        "The AI-recommended secondary domain is not available. Please select it manually.",
      );

      setSelectedPrimaryDomainId(aiPrimaryDomainId);

      return;
    }

    setSelectedPrimaryDomainId(aiPrimaryDomainId);

    setSelectedSecondaryDomainId(aiSecondaryDomainId);

    await saveDomainSelection(aiPrimaryDomainId, aiSecondaryDomainId);
  }

  async function handleSaveCustomDomains() {
    await saveDomainSelection(
      selectedPrimaryDomainId,
      selectedSecondaryDomainId,
    );
  }

  async function handleStartTask(taskId: string) {
    try {
      if (!profileContext?.task_domains_confirmed) {
        toast.error("Please confirm your domains before starting a task.");

        return;
      }

      if (activeTask) {
        toast.error(
          "You already have one task in progress. Submit it or wait until it expires.",
        );

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

      const response = await fetch("/api/task/start", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          taskId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needsDomainSelection) {
          toast.error("Please confirm your domains first.");

          return;
        }

        toast.error(result.error || "Failed to start task.");

        return;
      }

      toast.success("Task started successfully.");

      await Promise.all([loadRecommendations(token), loadMyTasks(token)]);
    } catch (error) {
      console.error("handleStartTask error:", error);

      toast.error("Something went wrong while starting the task.");
    } finally {
      setStartingTaskId(null);
    }
  }

  const resolvedSkillLevel = profileContext?.skill_level ?? "-";
  /*
   * The selector is shown only until the first confirmation.
   */
  const shouldShowDomainSelector = Boolean(
    profileContext?.has_assessment && !profileContext.task_domains_confirmed,
  );

  /*
   * Recommendations are shown permanently after confirmation.
   */
  const shouldShowRecommendations = Boolean(
    profileContext?.task_domains_confirmed,
  );
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Task Allocation</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Review the domains recommended by AI, confirm your preferred domains
          and receive suitable freelancing tasks.
        </p>
      </div>

      {activeTask ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">You already have one task in progress.</p>

          <p className="mt-1">
            Current Task: {activeTask.task?.title || "Task"}
            {" | "}
            Remaining Time:{" "}
            <span className="font-semibold">
              {getRemainingText(activeTask, now)}
            </span>
          </p>
        </div>
      ) : null}

      {loadingProfileContext ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Loading your assessment and domain information...
        </div>
      ) : !profileContext?.has_assessment ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">
            Skill Assessment Required
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Complete the skill assessment first. After the assessment, AI will
            recommend primary and secondary freelancing domains.
          </p>

          <div className="mt-4">
            <Link href="/dashboard/assessment">
              <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                Go to Skill Assessment
              </button>
            </Link>
          </div>
        </section>
      ) : null}

      {shouldShowDomainSelector && profileContext ? (
        <section className="space-y-5 rounded-xl border bg-background p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Confirm Your Task Domains</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              AI recommends the following domains based on your skill
              assessment. You may accept these recommendations or choose your
              own domains.
            </p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-semibold">Important:</span> You can confirm
              your primary and secondary domains only once. After confirmation,
              these domains cannot be changed.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                AI Recommended Primary
              </p>

              <p className="mt-1 font-semibold text-blue-800">
                {profileContext.ai_primary_domain_name || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                AI Recommended Secondary
              </p>

              <p className="mt-1 font-semibold text-blue-800">
                {profileContext.ai_secondary_domain_names?.length
                  ? profileContext.ai_secondary_domain_names.join(", ")
                  : "-"}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Current Skill Level</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {resolvedSkillLevel}
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="font-medium">
              Option 1: Continue with AI Recommendations
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Use the primary domain and first secondary domain suggested by AI.
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="font-medium">Option 2: Select Domains Manually</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Select one primary and one secondary domain. Both domains must be
              different.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="primary-domain" className="text-sm font-medium">
                  Primary Domain
                </label>

                <select
                  id="primary-domain"
                  value={selectedPrimaryDomainId}
                  onChange={(event) =>
                    setSelectedPrimaryDomainId(event.target.value)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select primary domain</option>

                  {domains.map((domain) => (
                    <option
                      key={domain.id}
                      value={domain.id}
                      disabled={domain.id === selectedSecondaryDomainId}
                    >
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="secondary-domain"
                  className="text-sm font-medium"
                >
                  Secondary Domain
                </label>

                <select
                  id="secondary-domain"
                  value={selectedSecondaryDomainId}
                  onChange={(event) =>
                    setSelectedSecondaryDomainId(event.target.value)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select secondary domain</option>

                  {domains.map((domain) => (
                    <option
                      key={domain.id}
                      value={domain.id}
                      disabled={domain.id === selectedPrimaryDomainId}
                    >
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveCustomDomains}
                disabled={savingDomains}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingDomains ? "Confirming..." : "Confirm AI Recommendations"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {profileContext?.task_domains_confirmed ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Your Confirmed Task Domains
              </h2>

              <p className="text-sm text-muted-foreground">
                These domains are permanently linked to your task
                recommendations and cannot be changed.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Selected Primary Domain</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {profileContext.primary_domain_name || "-"}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Selected Secondary Domain</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {profileContext.secondary_domain_name || "-"}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Selection Method</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {profileContext.domain_selection_source === "ai"
                  ? "AI Recommendation"
                  : profileContext.domain_selection_source === "custom"
                    ? "Selected Manually"
                    : "-"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <span className="font-medium">Original AI Recommendation:</span>{" "}
            {profileContext.ai_primary_domain_name || "-"}
            {" / "}
            {profileContext.ai_secondary_domain_names?.[0] || "-"}
          </div>
        </section>
      ) : null}

      {progress && shouldShowRecommendations ? (
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

      {shouldShowRecommendations ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">AI Recommended Tasks</h2>

            <p className="text-sm text-muted-foreground">
              Tasks are selected using your confirmed domains, skill level and
              previous progress. You can start only one active task at a time.
            </p>
          </div>

          {loadingRecommendations ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              Loading AI recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              No recommended tasks were found. Make sure active tasks exist for
              your selected primary or secondary domain.
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
                        {formatDeliverableType(
                          task.deliverable_type,
                          task.evaluation_type,
                        )}
                      </p>

                      <p>
                        <span className="font-medium">Evaluation Type:</span>{" "}
                        {task.evaluation_type || "general"}
                      </p>

                      <p>
                        <span className="font-medium">AI Score:</span>{" "}
                        {task.recommendation_score}
                        /100
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
                        type="button"
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
      ) : profileContext?.has_assessment && !loadingProfileContext ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Confirm your primary and secondary domains to view AI-recommended
          tasks.
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">My Allocated Tasks</h2>

          <p className="text-sm text-muted-foreground">
            Existing tasks remain available even when you change your future
            task domains.
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

              const status = normalizeStatus(item.status);

              const showFeedback = canViewFeedback(item.status);

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
                              : showFeedback
                                ? "rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                                : "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {expired ? "expired" : item.status}
                      </span>

                      {item.started_at && active ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Remaining: {remainingText}
                        </p>
                      ) : null}

                      {item.started_at && expired ? (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          Time over
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
                      {formatDeliverableType(
                        item.task?.deliverable_type,
                        item.task?.evaluation_type,
                      )}
                    </p>

                    <p>
                      <span className="font-medium">Evaluation Type:</span>{" "}
                      {item.task?.evaluation_type || "general"}
                    </p>

                    <p>
                      <span className="font-medium">Started At:</span>{" "}
                      {item.started_at
                        ? new Date(item.started_at).toLocaleString()
                        : "-"}
                    </p>

                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {item.status || "-"}
                    </p>
                  </div>

                  {item.recommendation_score !== null &&
                  item.recommendation_score !== undefined ? (
                    <p className="mt-3 text-sm">
                      <span className="font-medium">
                        AI Recommendation Score:
                      </span>{" "}
                      {item.recommendation_score}
                      /100
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

                  {status === "under_review" ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Your submission is under AI review. Feedback will appear
                      after evaluation is completed.
                    </div>
                  ) : null}

                  {expired ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Submission time is over. This task cannot be submitted
                      now.
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {active ? (
                      <Link href={`/dashboard/submit/${item.id}`}>
                        <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">
                          Submit Work
                        </button>
                      </Link>
                    ) : null}

                    {showFeedback ? (
                      <Link
                        href={`/dashboard/feedback?assignmentId=${item.id}`}
                      >
                        <button className="rounded-lg border px-4 py-2 text-sm">
                          View AI Feedback
                        </button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
