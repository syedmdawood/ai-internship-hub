import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizeRelation<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getTime(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Missing authorization token",
        },
        {
          status: 401,
        }
      );
    }

    const token = authHeader
      .replace("Bearer ", "")
      .trim();

    const userResult =
      await supabaseAdmin.auth.getUser(token);

    if (
      userResult.error ||
      !userResult.data.user
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired authorization token",
        },
        {
          status: 401,
        }
      );
    }

    const user = userResult.data.user;

    const url = new URL(req.url);

    const assignmentId =
      url.searchParams
        .get("assignmentId")
        ?.trim() || null;

    /*
     * Start with task assignments rather than
     * task evaluations.
     *
     * This allows submitted/completed tasks to
     * appear even if only mentor feedback exists.
     */
    let assignmentsQuery = supabaseAdmin
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
        completed_at,
        task:tasks (
          id,
          title,
          description,
          difficulty_level,
          deliverable_type,
          evaluation_type
        )
      `)
      .eq("student_id", user.id)
      .in("status", [
        "submitted",
        "reviewed",
        "completed",
        "approved",
      ]);

    if (assignmentId) {
      assignmentsQuery =
        assignmentsQuery.eq(
          "id",
          assignmentId
        );
    }

    const {
      data: assignments,
      error: assignmentsError,
    } = await assignmentsQuery;

    if (assignmentsError) {
      console.error(
        "Task assignments fetch error:",
        assignmentsError
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch submitted tasks",
        },
        {
          status: 500,
        }
      );
    }

    const assignmentRows =
      assignments ?? [];

    if (assignmentRows.length === 0) {
      return NextResponse.json({
        success: true,
        feedbackItems: [],
        evaluations: [],
      });
    }

    const assignmentIds =
      assignmentRows.map(
        (assignment) => assignment.id
      );

    const [
      submissionsResult,
      evaluationsResult,
      mentorFeedbackResult,
    ] = await Promise.all([
      /*
       * Load all student submissions.
       * Latest submission is placed first.
       */
      supabaseAdmin
        .from("task_submissions")
        .select(`
          id,
          assignment_id,
          student_id,
          submitted_at,
          submission_text,
          submission_url,
          github_url,
          figma_url,
          screenshot_url,
          code_snippets,
          code_files,
          notes,
          files,
          status
        `)
        .eq("student_id", user.id)
        .in("assignment_id", assignmentIds)
        .order("submitted_at", {
          ascending: false,
        }),

      /*
       * Load all AI evaluations.
       * Latest evaluation is placed first.
       */
      supabaseAdmin
        .from("task_evaluations")
        .select(`
          id,
          assignment_id,
          submission_id,
          student_id,
          evaluation_type,
          ai_score,
          ai_feedback,
          strengths,
          improvements,
          plagiarism_risk,
          plagiarism_score,
          grammar_score,
          code_quality_score,
          design_quality_score,
          correctness_score,
          evaluated_at
        `)
        .eq("student_id", user.id)
        .in("assignment_id", assignmentIds)
        .order("evaluated_at", {
          ascending: false,
        }),

      /*
       * Only load mentor feedback that is
       * visible to the student.
       */
      supabaseAdmin
        .from("mentor_feedback")
        .select(`
          id,
          assignment_id,
          submission_id,
          student_id,
          mentor_id,
          subject,
          message,
          mentor_score,
          decision,
          is_visible_to_student,
          created_at,
          updated_at
        `)
        .eq("student_id", user.id)
        .eq("is_visible_to_student", true)
        .in("assignment_id", assignmentIds)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (submissionsResult.error) {
      console.error(
        "Task submissions fetch error:",
        submissionsResult.error
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch task submissions",
        },
        {
          status: 500,
        }
      );
    }

    if (evaluationsResult.error) {
      console.error(
        "Task evaluations fetch error:",
        evaluationsResult.error
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch AI evaluations",
        },
        {
          status: 500,
        }
      );
    }

    if (mentorFeedbackResult.error) {
      console.error(
        "Mentor feedback fetch error:",
        mentorFeedbackResult.error
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch mentor feedback",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Since records are ordered newest first,
     * preserve the first record found for every
     * assignment.
     */
    const submissionMap = new Map<
      string,
      (typeof submissionsResult.data)[number]
    >();

    for (
      const submission of
      submissionsResult.data ?? []
    ) {
      if (
        submission.assignment_id &&
        !submissionMap.has(
          submission.assignment_id
        )
      ) {
        submissionMap.set(
          submission.assignment_id,
          submission
        );
      }
    }

    const evaluationMap = new Map<
      string,
      (typeof evaluationsResult.data)[number]
    >();

    for (
      const evaluation of
      evaluationsResult.data ?? []
    ) {
      if (
        evaluation.assignment_id &&
        !evaluationMap.has(
          evaluation.assignment_id
        )
      ) {
        evaluationMap.set(
          evaluation.assignment_id,
          evaluation
        );
      }
    }

    const mentorFeedbackMap = new Map<
      string,
      (typeof mentorFeedbackResult.data)[number]
    >();

    for (
      const feedback of
      mentorFeedbackResult.data ?? []
    ) {
      if (
        feedback.assignment_id &&
        !mentorFeedbackMap.has(
          feedback.assignment_id
        )
      ) {
        mentorFeedbackMap.set(
          feedback.assignment_id,
          feedback
        );
      }
    }

    const feedbackItems =
      assignmentRows
        .map((assignment) => {
          const submission =
            submissionMap.get(
              assignment.id
            ) ?? null;

          const evaluation =
            evaluationMap.get(
              assignment.id
            ) ?? null;

          const mentorFeedback =
            mentorFeedbackMap.get(
              assignment.id
            ) ?? null;

          /*
           * Use the newest available date to
           * sort the feedback history.
           */
          const activityDates = [
            mentorFeedback?.updated_at,
            mentorFeedback?.created_at,
            evaluation?.evaluated_at,
            submission?.submitted_at,
            assignment.completed_at,
            assignment.submitted_at,
            assignment.started_at,
            assignment.assigned_at,
          ];

          const latestActivityTime =
            Math.max(
              ...activityDates.map(getTime),
              0
            );

          return {
            assignment: {
              id: assignment.id,
              student_id:
                assignment.student_id,
              task_id: assignment.task_id,
              status: assignment.status,
              mentor_score:
                assignment.mentor_score,
              assigned_at:
                assignment.assigned_at,
              started_at:
                assignment.started_at,
              submitted_at:
                assignment.submitted_at,
              completed_at:
                assignment.completed_at,
            },

            task: normalizeRelation(
              assignment.task
            ),

            submission,
            evaluation,
            mentorFeedback,

            latestActivityAt:
              latestActivityTime > 0
                ? new Date(
                    latestActivityTime
                  ).toISOString()
                : null,
          };
        })
        /*
         * Do not show an empty assignment without
         * submission, AI evaluation or feedback.
         */
        .filter(
          (item) =>
            item.submission ||
            item.evaluation ||
            item.mentorFeedback
        )
        /*
         * Latest feedback/task activity appears
         * first.
         */
        .sort(
          (first, second) =>
            getTime(
              second.latestActivityAt
            ) -
            getTime(
              first.latestActivityAt
            )
        );

    /*
     * Keep evaluations for backward compatibility
     * with any older frontend code.
     */
    const evaluations =
      feedbackItems
        .map((item) => item.evaluation)
        .filter(Boolean);

    return NextResponse.json({
      success: true,
      feedbackItems,
      evaluations,
    });
  } catch (error) {
    console.error(
      "Task feedback route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}