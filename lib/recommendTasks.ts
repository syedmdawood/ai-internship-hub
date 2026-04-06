import type { RecommendedTask, StudentProfile, Task } from "@/types/task";

function normalizeSkillLevel(level: string | null | undefined): "beginner" | "intermediate" | "advanced" {
  const value = (level || "").toLowerCase();

  if (value === "advanced") return "advanced";
  if (value === "intermediate") return "intermediate";
  return "beginner";
}

function skillDistance(studentLevel: string | null | undefined, taskLevel: string) {
  const levels = ["beginner", "intermediate", "advanced"];
  const studentIndex = levels.indexOf(normalizeSkillLevel(studentLevel));
  const taskIndex = levels.indexOf(taskLevel);
  return Math.abs(studentIndex - taskIndex);
}

export function recommendTasks(params: {
  tasks: Task[];
  profile: StudentProfile & { selected_task_domain_id?: string | null };
  assignedTaskIds: string[];
}) {
  const { tasks, profile, assignedTaskIds } = params;

  const studentLevel = profile.current_skill_level || profile.skill_level || "beginner";
  const selectedDomainId = profile.selected_task_domain_id || null;

  const filteredTasks = tasks.filter((task) => {
    if (!task.is_active) return false;
    if (assignedTaskIds.includes(task.id)) return false;
    if (selectedDomainId && task.domain_id !== selectedDomainId) return false;
    return true;
  });

  const recommended: RecommendedTask[] = filteredTasks
    .map((task) => {
      let score = 0;
      const reasons: string[] = [];

      const distance = skillDistance(studentLevel, task.difficulty_level);

      if (distance === 0) {
        score += 20;
        reasons.push("Matches your skill level");
      } else if (distance === 1) {
        score += 10;
        reasons.push("Slightly above or below your level");
      } else {
        score -= 10;
      }

      if (task.estimated_minutes <= 90) {
        score += 5;
        reasons.push("Good size for a short internship task");
      }

      return {
        ...task,
        recommendation_score: score,
        recommendation_reason: reasons.join(". "),
      };
    })
    .sort((a, b) => b.recommendation_score - a.recommendation_score);

  return recommended;
}