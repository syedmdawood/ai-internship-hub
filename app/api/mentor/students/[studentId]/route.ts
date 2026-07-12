import { NextResponse } from "next/server";
import { requireMentor } from "@/lib/requireMentor";

export const runtime = "nodejs";

type RouteContext = {
  params:
    | Promise<{ studentId: string }>
    | { studentId: string };
};

function normalizeTask(task: unknown) {
  if (Array.isArray(task)) {
    return task[0] ?? null;
  }

  return task ?? null;
}

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    /*
     * Verify that the logged-in user is a mentor.
     */
    const auth = await requireMentor(req);

    if ("errorResponse" in auth) {
      return auth.errorResponse;
    }

    const { studentId: rawStudentId } =
      await context.params;

    const studentId = rawStudentId?.trim();

    const { supabaseAdmin, user } = auth;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    /*
     * Every authenticated mentor can access
     * every valid student.
     *
     * No mentor_student_assignments relationship
     * check is required.
     */
    const [
      profileResult,
      assignmentsResult,
      submissionsResult,
      evaluationsResult,
      assessmentsResult,
      feedbackResult,
      authUserResult,
    ] = await Promise.all([
      /*
       * Student profile.
       */
      supabaseAdmin
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          bio,
          avatar_url,
          skills,
          skill_level,
          current_skill_level,
          recommended_domain,
          primary_domain,
          secondary_domains,
          last_assessment_at,
          created_at,
          updated_at
        `)
        .eq("id", studentId)
        .eq("role", "student")
        .maybeSingle(),

      /*
       * Student task assignments.
       */
      supabaseAdmin
        .from("task_assignments")
        .select(`
          id,
          student_id,
          task_id,
          status,
          recommendation_score,
          recommendation_reason,
          assigned_at,
          started_at,
          submitted_at,
          completed_at,
          mentor_score,
          tasks (
            id,
            title,
            description,
            difficulty_level,
            estimated_minutes,
            evaluation_type,
            deliverable_type,
            instructions,
            tags
          )
        `)
        .eq("student_id", studentId)
        .order("assigned_at", {
          ascending: false,
        }),

      /*
       * Student task submissions.
       *
       * Latest submissions are returned first so
       * the map can preserve the newest submission
       * when resubmissions exist.
       */
      supabaseAdmin
        .from("task_submissions")
        .select(`
          id,
          assignment_id,
          student_id,
          submission_text,
          submission_url,
          code_snippets,
          code_files,
          figma_url,
          screenshot_url,
          files,
          notes,
          checklist,
          status,
          submitted_at
        `)
        .eq("student_id", studentId)
        .order("submitted_at", {
          ascending: false,
        }),

      /*
       * AI evaluations.
       *
       * Latest evaluations are returned first.
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
        .eq("student_id", studentId)
        .order("evaluated_at", {
          ascending: false,
        }),

      /*
       * Skill-assessment history.
       */
      supabaseAdmin
        .from("assessment_results")
        .select(`
          id,
          domain_scores,
          recommended_domain,
          total_score,
          total_questions,
          percentage_score,
          skill_level,
          selected_domains,
          ai_recommendation,
          completed_at,
          status
        `)
        .eq("user_id", studentId)
        .order("completed_at", {
          ascending: false,
        }),

      /*
       * Load feedback from every mentor.
       *
       * This is required because the feedback API
       * prevents another mentor from reviewing an
       * assignment that has already been reviewed.
       */
      supabaseAdmin
        .from("mentor_feedback")
        .select(`
          id,
          mentor_id,
          student_id,
          assignment_id,
          submission_id,
          subject,
          message,
          mentor_score,
          decision,
          is_visible_to_student,
          created_at,
          updated_at
        `)
        .eq("student_id", studentId)
        .order("created_at", {
          ascending: false,
        }),

      /*
       * Email is stored in Supabase Auth rather
       * than the profiles table.
       */
      supabaseAdmin.auth.admin.getUserById(
        studentId
      ),
    ]);

    /*
     * Validate profile query.
     */
    if (profileResult.error) {
      console.error(
        "Student profile lookup error:",
        profileResult.error
      );

      throw profileResult.error;
    }

    if (!profileResult.data) {
      return NextResponse.json(
        { error: "Student was not found" },
        { status: 404 }
      );
    }

    /*
     * Validate remaining queries.
     */
    if (assignmentsResult.error) {
      console.error(
        "Student assignments error:",
        assignmentsResult.error
      );

      throw assignmentsResult.error;
    }

    if (submissionsResult.error) {
      console.error(
        "Student submissions error:",
        submissionsResult.error
      );

      throw submissionsResult.error;
    }

    if (evaluationsResult.error) {
      console.error(
        "Student evaluations error:",
        evaluationsResult.error
      );

      throw evaluationsResult.error;
    }

    if (assessmentsResult.error) {
      console.error(
        "Student assessments error:",
        assessmentsResult.error
      );

      throw assessmentsResult.error;
    }

    if (feedbackResult.error) {
      console.error(
        "Student mentor feedback error:",
        feedbackResult.error
      );

      throw feedbackResult.error;
    }

    /*
     * Failure to load the email should not prevent
     * the remainder of the student progress page
     * from loading.
     */
    if (authUserResult.error) {
      console.error(
        "Student auth-user lookup error:",
        authUserResult.error
      );
    }

    /*
     * Preserve only the latest submission for each
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

    /*
     * Preserve only the latest AI evaluation for
     * each assignment.
     */
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

    /*
     * Assignment feedback can be written by any
     * mentor. Preserve the latest feedback record.
     */
    const feedbackMap = new Map<
      string,
      (typeof feedbackResult.data)[number]
    >();

    for (
      const feedback of feedbackResult.data ?? []
    ) {
      if (
        feedback.assignment_id &&
        !feedbackMap.has(feedback.assignment_id)
      ) {
        feedbackMap.set(
          feedback.assignment_id,
          feedback
        );
      }
    }

    /*
     * Combine assignment, task, submission,
     * AI evaluation and mentor feedback.
     */
    const assignments = (
      assignmentsResult.data ?? []
    ).map((assignment) => {
      const task = normalizeTask(
        assignment.tasks
      );

      return {
        id: assignment.id,
        student_id: assignment.student_id,
        task_id: assignment.task_id,
        status: assignment.status,

        recommendation_score:
          assignment.recommendation_score,

        recommendation_reason:
          assignment.recommendation_reason,

        assigned_at: assignment.assigned_at,
        started_at: assignment.started_at,
        submitted_at: assignment.submitted_at,
        completed_at: assignment.completed_at,
        mentor_score: assignment.mentor_score,

        task,

        submission:
          submissionMap.get(assignment.id) ??
          null,

        evaluation:
          evaluationMap.get(assignment.id) ??
          null,

        mentorFeedback:
          feedbackMap.get(assignment.id) ??
          null,
      };
    });

    /*
     * General feedback is not attached to an
     * assignment.
     *
     * Only return general feedback created by the
     * currently logged-in mentor. Assignment review
     * feedback from every mentor remains visible
     * inside assignments.
     */
    const generalFeedback = (
      feedbackResult.data ?? []
    ).filter(
      (feedback) =>
        !feedback.assignment_id &&
        feedback.mentor_id === user.id
    );

    return NextResponse.json({
      success: true,

      student: {
        ...profileResult.data,
        email:
          authUserResult.data.user?.email ?? "",
      },

      latestAssessment:
        assessmentsResult.data?.[0] ?? null,

      assessmentHistory:
        assessmentsResult.data ?? [],

      assignments,

      generalFeedback,
    });
  } catch (error) {
    console.error(
      "Mentor student detail error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load student progress",
      },
      { status: 500 }
    );
  }
}