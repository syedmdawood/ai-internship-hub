type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type TaskForRecommendation = {
  id: string;
  domain_id: string;
  title: string;
  description: string;
  difficulty_level: DifficultyLevel;
  estimated_minutes: number;
  deliverable_type: string;
  evaluation_type?: string | null;
  evaluation_criteria?: any;
  instructions: string | null;
  tags: string[] | null;
  is_active: boolean;
};

export type StudentProfileForRecommendation = {
  id: string;
  primary_domain_id: string | null;
  secondary_domain_id: string | null;
  skill_level: string | null;
  current_skill_level: string | null;
};

export type AssignmentForRecommendation = {
  task_id: string;
  status: string;
  mentor_score?: number | null;
  recommendation_score?: number | null;
  assigned_at?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
};

export type RecommendedTask = TaskForRecommendation & {
  recommendation_score: number;
  recommendation_reason: string;
};

function normalizeSkillLevel(
  level: string | null | undefined,
): DifficultyLevel {
  const value = String(level || "").toLowerCase();

  if (value.includes("advanced")) return "advanced";
  if (value.includes("intermediate")) return "intermediate";

  return "beginner";
}

function difficultyValue(level: string | null | undefined) {
  const normalized = normalizeSkillLevel(level);

  if (normalized === "advanced") return 3;
  if (normalized === "intermediate") return 2;

  return 1;
}

function getProgressSummary(assignments: AssignmentForRecommendation[]) {
  const completed = assignments.filter((item) =>
    ["completed", "approved"].includes(item.status),
  );

  const inProgress = assignments.filter((item) =>
    ["assigned", "in_progress", "submitted", "under_review"].includes(
      item.status,
    ),
  );

  const averageMentorScore =
    completed.length > 0
      ? completed.reduce(
          (sum, item) => sum + Number(item.mentor_score || 0),
          0,
        ) / completed.length
      : null;

  return {
    totalAssigned: assignments.length,
    completedCount: completed.length,
    inProgressCount: inProgress.length,
    averageMentorScore,
  };
}

function fallbackRecommendTasks(params: {
  tasks: TaskForRecommendation[];
  profile: StudentProfileForRecommendation;
  assignments: AssignmentForRecommendation[];
  limit?: number;
}): RecommendedTask[] {
  const { tasks, profile, assignments, limit = 6 } = params;

  const assignedTaskIds = new Set(assignments.map((item) => item.task_id));
  const progress = getProgressSummary(assignments);

  const studentLevel =
    profile.current_skill_level || profile.skill_level || "beginner";

  const studentDifficultyValue = difficultyValue(studentLevel);

  const availableTasks = tasks.filter((task) => {
    if (!task.is_active) return false;
    if (assignedTaskIds.has(task.id)) return false;
    return true;
  });

  const recommended = availableTasks.map((task) => {
    let score = 0;
    const reasons: string[] = [];

    if (task.domain_id === profile.primary_domain_id) {
      score += 40;
      reasons.push("it matches your primary recommended domain");
    }

    if (task.domain_id === profile.secondary_domain_id) {
      score += 25;
      reasons.push("it matches your secondary recommended domain");
    }

    const taskDifficultyValue = difficultyValue(task.difficulty_level);
    const difficultyGap = Math.abs(
      studentDifficultyValue - taskDifficultyValue,
    );

    if (difficultyGap === 0) {
      score += 30;
      reasons.push("it matches your current skill level");
    } else if (difficultyGap === 1) {
      score += 15;
      reasons.push("it gives you a manageable challenge");
    } else {
      score -= 10;
    }

    if (progress.completedCount === 0 && task.difficulty_level === "beginner") {
      score += 15;
      reasons.push("it is suitable as an early practical task");
    }

    if (
      progress.completedCount >= 2 &&
      normalizeSkillLevel(studentLevel) === "beginner" &&
      task.difficulty_level === "intermediate"
    ) {
      score += 10;
      reasons.push("it can help you move toward the next skill level");
    }

    if (task.estimated_minutes <= 90) {
      score += 5;
      reasons.push("it has a manageable estimated completion time");
    }

    return {
      ...task,
      recommendation_score: Math.max(0, Math.min(100, Math.round(score))),
      recommendation_reason:
        reasons.length > 0
          ? `Recommended because ${reasons.join(", ")}.`
          : "Recommended based on your profile and progress.",
    };
  });

  return recommended
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);
}

export async function recommendTasks(params: {
  tasks: TaskForRecommendation[];
  profile: StudentProfileForRecommendation;
  assignments: AssignmentForRecommendation[];
  limit?: number;
}): Promise<RecommendedTask[]> {
  const { tasks, profile, assignments, limit = 6 } = params;

  const fallbackRecommendations = fallbackRecommendTasks({
    tasks,
    profile,
    assignments,
    limit: 20,
  });

  if (!process.env.OPENAI_API_KEY) {
    return fallbackRecommendations.slice(0, limit);
  }

  if (fallbackRecommendations.length === 0) {
    return [];
  }

  const progress = getProgressSummary(assignments);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are an AI task recommendation engine for a freelancing skill development platform. Recommend tasks using student profile, assessment result, skill level, previous progress, and available tasks. Return only a valid JSON object in this exact format: { "recommendations": [{ "task_id": "string", "score": 0-100, "reason": "string" }] }.',
          },
          {
            role: "user",
            content: JSON.stringify({
              student_profile: {
                primary_domain_id: profile.primary_domain_id,
                secondary_domain_id: profile.secondary_domain_id,
                skill_level: profile.skill_level,
                current_skill_level: profile.current_skill_level,
              },
              progress,
              available_tasks: fallbackRecommendations.map((task) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                domain_id: task.domain_id,
                difficulty_level: task.difficulty_level,
                estimated_minutes: task.estimated_minutes,
                deliverable_type: task.deliverable_type,
                evaluation_type: task.evaluation_type,
                tags: task.tags,
              })),
              output_format: {
                recommendations:
                  "Array of { task_id: string, score: number, reason: string }",
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallbackRecommendations.slice(0, limit);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const aiRecommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [];

    const taskMap = new Map(
      fallbackRecommendations.map((task) => [task.id, task]),
    );

    const finalRecommendations = aiRecommendations
      .map((item: any) => {
        const task = taskMap.get(item.task_id);

        if (!task) return null;

        return {
          ...task,
          recommendation_score: Math.max(
            0,
            Math.min(100, Number(item.score || task.recommendation_score)),
          ),
          recommendation_reason:
            String(item.reason || "").trim() || task.recommendation_reason,
        };
      })
      .filter(Boolean) as RecommendedTask[];

    const usedTaskIds = new Set(finalRecommendations.map((task) => task.id));

    const mergedRecommendations = [
      ...finalRecommendations,
      ...fallbackRecommendations.filter((task) => !usedTaskIds.has(task.id)),
    ];

    return mergedRecommendations.slice(0, limit);
  } catch (error) {
    console.error("AI task recommendation failed. Using fallback:", error);
    return fallbackRecommendations.slice(0, limit);
  }
}
