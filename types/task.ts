export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type TaskStatus = "in_progress" | "submitted" | "reviewed" | "completed";

export type DeliverableType = "text" | "github_link" | "figma_url" | "document_url";

export interface Task {
  id: string;
  title: string;
  description: string;
  domain_id: string | null;
  difficulty_level: SkillLevel;
  estimated_minutes: number;
  tags: string[] | null;
  deliverable_type: DeliverableType;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  role: string | null;
  primary_domain_id: string | null;
  secondary_domain_id: string | null;
  skill_level: string | null;
  current_skill_level: string | null;
}

export interface RecommendedTask extends Task {
  recommendation_score: number;
  recommendation_reason: string;
}