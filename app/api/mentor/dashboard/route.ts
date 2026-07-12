import { NextResponse } from "next/server";
import { requireMentor } from "@/lib/requireMentor";

export const runtime = "nodejs";

function numericValue(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: Request) {
  try {
    /*
     * Securely verify that the logged-in user
     * has the mentor role.
     */
    const auth = await requireMentor(req);

    if ("errorResponse" in auth) {
      return auth.errorResponse;
    }

    const { supabaseAdmin } = auth;

    /*
     * Every mentor can see every student.
     * No mentor_student_assignments table is used.
     */
    const { data: profiles, error: profilesError } =
      await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          skill_level,
          current_skill_level,
          recommended_domain,
          primary_domain,
          skills,
          avatar_url,
          updated_at
        `)
        .eq("role", "student")
        .order("created_at", {
          ascending: false,
        });

    if (profilesError) {
      console.error(
        "Mentor dashboard profiles error:",
        profilesError,
      );

      throw profilesError;
    }

    const studentProfiles = profiles ?? [];

    /*
     * Return an empty dashboard if no student exists.
     */
    if (studentProfiles.length === 0) {
      return NextResponse.json({
        success: true,

        stats: {
          totalStudents: 0,
          averageScore: 0,
          pendingReviews: 0,
          completedTasks: 0,
          topPerformer: null,
        },

        students: [],
      });
    }

    const studentIds = studentProfiles.map(
      (profile) => profile.id,
    );

    /*
     * Load all task progress, AI evaluations,
     * and mentor feedback for all students.
     */
    const [
      assignmentsResult,
      evaluationsResult,
      feedbackResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("task_assignments")
        .select(`
          id,
          student_id,
          task_id,
          status,
          mentor_score,
          assigned_at,
          started_at,
          submitted_at,
          completed_at
        `)
        .in("student_id", studentIds),

      supabaseAdmin
        .from("task_evaluations")
        .select(`
          assignment_id,
          student_id,
          ai_score,
          evaluated_at
        `)
        .in("student_id", studentIds),

      /*
       * Load feedback from every mentor.
       *
       * If any mentor has reviewed an assignment,
       * it should no longer appear as pending.
       */
      supabaseAdmin
        .from("mentor_feedback")
        .select(`
          assignment_id,
          student_id,
          mentor_id,
          mentor_score,
          decision,
          created_at
        `)
        .in("student_id", studentIds),
    ]);

    if (assignmentsResult.error) {
      console.error(
        "Mentor dashboard assignments error:",
        assignmentsResult.error,
      );

      throw assignmentsResult.error;
    }

    if (evaluationsResult.error) {
      console.error(
        "Mentor dashboard evaluations error:",
        evaluationsResult.error,
      );

      throw evaluationsResult.error;
    }

    if (feedbackResult.error) {
      console.error(
        "Mentor dashboard feedback error:",
        feedbackResult.error,
      );

      throw feedbackResult.error;
    }

    const assignments =
      assignmentsResult.data ?? [];

    const evaluations =
      evaluationsResult.data ?? [];

    const feedback =
      feedbackResult.data ?? [];

    /*
     * Authentication emails are stored in auth.users,
     * not in the profiles table.
     */
    const emailEntries = await Promise.all(
      studentIds.map(async (studentId) => {
        const {
          data,
          error,
        } =
          await supabaseAdmin.auth.admin.getUserById(
            studentId,
          );

        if (error) {
          console.error(
            `Unable to load email for student ${studentId}:`,
            error,
          );
        }

        return [
          studentId,
          data.user?.email ?? "",
        ] as const;
      }),
    );

    const emailMap = new Map(emailEntries);

    /*
     * Map AI score by task assignment.
     */
    const evaluationMap = new Map<
      string,
      number | null
    >(
      evaluations.map((evaluation) => [
        evaluation.assignment_id,
        numericValue(evaluation.ai_score),
      ]),
    );

    /*
     * Track assignments that already have
     * mentor feedback from any mentor.
     */
    const reviewedAssignmentIds = new Set(
      feedback
        .filter(
          (item) =>
            item.assignment_id !== null &&
            item.assignment_id !== undefined,
        )
        .map((item) => item.assignment_id),
    );

    /*
     * A task is counted as completed only after
     * mentor completion or approval.
     *
     * "reviewed" is not included because FR4 uses
     * that status after AI evaluation.
     */
    const completedStatuses = new Set([
      "completed",
      "approved",
    ]);

    const students = studentProfiles.map(
      (profile) => {
        const studentAssignments =
          assignments.filter(
            (assignment) =>
              assignment.student_id === profile.id,
          );

        const completedAssignments =
          studentAssignments.filter(
            (assignment) =>
              completedStatuses.has(
                assignment.status,
              ),
          );

        /*
         * Use mentor score when available.
         * Otherwise, use the AI score.
         */
        const scores = studentAssignments
          .map((assignment) => {
            const mentorScore = numericValue(
              assignment.mentor_score,
            );

            if (mentorScore !== null) {
              return mentorScore;
            }

            return (
              evaluationMap.get(assignment.id) ??
              null
            );
          })
          .filter(
            (score): score is number =>
              score !== null,
          );

        const averageScore =
          scores.length > 0
            ? Math.round(
                scores.reduce(
                  (sum, score) =>
                    sum + score,
                  0,
                ) / scores.length,
              )
            : 0;

        const progress =
          studentAssignments.length > 0
            ? Math.round(
                (completedAssignments.length /
                  studentAssignments.length) *
                  100,
              )
            : 0;

        /*
         * "reviewed" means AI evaluation has finished
         * and the task is waiting for mentor feedback.
         *
         * under_review is not included because AI
         * evaluation may still be running.
         */
        const pendingReviews =
          studentAssignments.filter(
            (assignment) =>
              assignment.status === "reviewed" &&
              evaluationMap.has(assignment.id) &&
              !reviewedAssignmentIds.has(
                assignment.id,
              ),
          ).length;

        const activityDates =
          studentAssignments
            .flatMap((assignment) => [
              assignment.completed_at,
              assignment.submitted_at,
              assignment.started_at,
              assignment.assigned_at,
            ])
            .filter(
              (
                date,
              ): date is string =>
                typeof date === "string" &&
                date.length > 0,
            )
            .map((date) =>
              new Date(date).getTime(),
            )
            .filter(Number.isFinite);

        const lastActive =
          activityDates.length > 0
            ? new Date(
                Math.max(...activityDates),
              ).toISOString()
            : profile.updated_at;

        return {
          id: profile.id,

          name:
            profile.full_name ||
            "Unnamed Student",

          email:
            emailMap.get(profile.id) || "",

          domain:
            profile.primary_domain ||
            profile.recommended_domain ||
            "Not selected",

          skillLevel:
            profile.current_skill_level ||
            profile.skill_level ||
            "Not assessed",

          skills: profile.skills ?? [],

          avatarUrl:
            profile.avatar_url ?? null,

          totalTasks:
            studentAssignments.length,

          tasksCompleted:
            completedAssignments.length,

          pendingReviews,

          progress,

          averageScore,

          lastActive:
            lastActive ?? null,
        };
      },
    );

    /*
     * Calculate overall average score.
     *
     * Students without any score are excluded.
     */
    const studentsWithScores = students.filter(
      (student) => student.averageScore > 0,
    );

    const averageScore =
      studentsWithScores.length > 0
        ? Math.round(
            studentsWithScores.reduce(
              (sum, student) =>
                sum + student.averageScore,
              0,
            ) / studentsWithScores.length,
          )
        : 0;

    /*
     * Only show a top performer when at least one
     * student has an evaluation score.
     */
    const topPerformer =
      studentsWithScores.length > 0
        ? [...studentsWithScores].sort(
            (first, second) =>
              second.averageScore -
              first.averageScore,
          )[0]
        : null;

    return NextResponse.json({
      success: true,

      stats: {
        totalStudents: students.length,

        averageScore,

        pendingReviews: students.reduce(
          (sum, student) =>
            sum + student.pendingReviews,
          0,
        ),

        completedTasks: students.reduce(
          (sum, student) =>
            sum + student.tasksCompleted,
          0,
        ),

        topPerformer: topPerformer
          ? {
              id: topPerformer.id,
              name: topPerformer.name,
              averageScore:
                topPerformer.averageScore,
            }
          : null,
      },

      students,
    });
  } catch (error) {
    console.error(
      "Mentor dashboard error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load mentor dashboard",
      },
      { status: 500 },
    );
  }
}