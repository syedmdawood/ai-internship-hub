import { NextResponse } from "next/server";
import { requireMentor } from "@/lib/requireMentor";

export const runtime = "nodejs";

type FeedbackBody = {
  studentId?: string;
  assignmentId?: string | null;
  subject?: string;
  message?: string;
  mentorScore?: number | string | null;
  decision?: "general" | "reviewed" | "approved";
  isVisibleToStudent?: boolean;
};

export async function POST(req: Request) {
  try {
    /*
     * Verify the logged-in user is a mentor.
     */
    const auth = await requireMentor(req);

    if ("errorResponse" in auth) {
      return auth.errorResponse;
    }

    const { supabaseAdmin, user } = auth;
    const body = (await req.json()) as FeedbackBody;

    const assignmentId =
      typeof body.assignmentId === "string" &&
      body.assignmentId.trim()
        ? body.assignmentId.trim()
        : null;

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!subject) {
      return NextResponse.json(
        { error: "Feedback subject is required" },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Feedback message is required" },
        { status: 400 },
      );
    }

    let studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    let submissionId: string | null = null;

    /*
     * Assignment-specific task review.
     */
    if (assignmentId) {
      const {
        data: assignment,
        error: assignmentError,
      } = await supabaseAdmin
        .from("task_assignments")
        .select(`
          id,
          student_id,
          task_id,
          status
        `)
        .eq("id", assignmentId)
        .single();

      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: "Task assignment was not found" },
          { status: 404 },
        );
      }

      /*
       * Always derive the student from the assignment.
       * Do not trust a student ID supplied by the browser.
       */
      studentId = assignment.student_id;

      /*
       * Mentor review should happen only after submission.
       */
      const {
        data: submission,
        error: submissionError,
      } = await supabaseAdmin
        .from("task_submissions")
        .select(`
          id,
          assignment_id,
          student_id,
          status
        `)
        .eq("assignment_id", assignmentId)
        .maybeSingle();

      if (submissionError) {
        console.error(
          "Feedback submission lookup error:",
          submissionError,
        );

        return NextResponse.json(
          { error: "Failed to load task submission" },
          { status: 500 },
        );
      }

      if (!submission) {
        return NextResponse.json(
          {
            error:
              "The student has not submitted work for this task",
          },
          { status: 400 },
        );
      }

      if (submission.student_id !== studentId) {
        return NextResponse.json(
          {
            error:
              "The task submission does not belong to this student",
          },
          { status: 400 },
        );
      }

      submissionId = submission.id;

      /*
       * Require an AI evaluation before mentor review.
       */
      const {
        data: evaluation,
        error: evaluationError,
      } = await supabaseAdmin
        .from("task_evaluations")
        .select("id, assignment_id")
        .eq("assignment_id", assignmentId)
        .maybeSingle();

      if (evaluationError) {
        console.error(
          "Feedback evaluation lookup error:",
          evaluationError,
        );

        return NextResponse.json(
          { error: "Failed to load AI evaluation" },
          { status: 500 },
        );
      }

      if (!evaluation) {
        return NextResponse.json(
          {
            error:
              "AI evaluation must be completed before mentor review",
          },
          { status: 400 },
        );
      }
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    /*
     * Every mentor can access every valid student.
     * No mentor_student_assignments check is needed.
     */
    const {
      data: studentProfile,
      error: studentProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();

    if (studentProfileError) {
      console.error(
        "Feedback student lookup error:",
        studentProfileError,
      );

      return NextResponse.json(
        { error: "Failed to validate student" },
        { status: 500 },
      );
    }

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student was not found" },
        { status: 404 },
      );
    }

    /*
     * Assignment review requires a mentor score.
     * General feedback does not require a score.
     */
    let mentorScore: number | null = null;

    if (
      body.mentorScore !== null &&
      body.mentorScore !== undefined &&
      body.mentorScore !== ""
    ) {
      mentorScore = Number(body.mentorScore);
    }

    if (assignmentId) {
      if (
        mentorScore === null ||
        !Number.isFinite(mentorScore) ||
        mentorScore < 0 ||
        mentorScore > 100
      ) {
        return NextResponse.json(
          {
            error:
              "Mentor score must be between 0 and 100",
          },
          { status: 400 },
        );
      }
    }

    /*
     * General feedback cannot approve a task.
     */
    const decision = assignmentId
      ? body.decision === "approved"
        ? "approved"
        : "reviewed"
      : "general";

    const now = new Date().toISOString();

    const feedbackRecord = {
      mentor_id: user.id,
      student_id: studentId,
      assignment_id: assignmentId,
      submission_id: submissionId,
      subject,
      message,
      mentor_score: mentorScore,
      decision,
      is_visible_to_student:
        body.isVisibleToStudent !== false,
      updated_at: now,
    };

    let savedFeedback;

    if (assignmentId) {
      /*
       * Check whether this assignment has already
       * been reviewed by a mentor.
       */
      const {
        data: existingFeedback,
        error: existingFeedbackError,
      } = await supabaseAdmin
        .from("mentor_feedback")
        .select(`
          id,
          mentor_id,
          assignment_id
        `)
        .eq("assignment_id", assignmentId)
        .maybeSingle();

      if (existingFeedbackError) {
        console.error(
          "Existing mentor feedback lookup error:",
          existingFeedbackError,
        );

        return NextResponse.json(
          {
            error:
              "Failed to check existing mentor feedback",
          },
          { status: 500 },
        );
      }

      /*
       * Another mentor already completed this review.
       */
      if (
        existingFeedback &&
        existingFeedback.mentor_id !== user.id
      ) {
        return NextResponse.json(
          {
            error:
              "This task has already been reviewed by another mentor",
            alreadyReviewed: true,
          },
          { status: 409 },
        );
      }

      if (existingFeedback) {
        /*
         * The same mentor can update their previous review.
         */
        const {
          data,
          error,
        } = await supabaseAdmin
          .from("mentor_feedback")
          .update(feedbackRecord)
          .eq("id", existingFeedback.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedFeedback = data;
      } else {
        /*
         * First mentor review for this assignment.
         */
        const {
          data,
          error,
        } = await supabaseAdmin
          .from("mentor_feedback")
          .insert(feedbackRecord)
          .select()
          .single();

        if (error) {
          /*
           * Protect against simultaneous review requests.
           */
          if (error.code === "23505") {
            return NextResponse.json(
              {
                error:
                  "This task has already been reviewed",
                alreadyReviewed: true,
              },
              { status: 409 },
            );
          }

          throw error;
        }

        savedFeedback = data;
      }

      /*
       * Save the human mentor score separately
       * from task_evaluations.ai_score.
       */
      const nextStatus =
        decision === "approved"
          ? "approved"
          : "completed";

      const {
        error: assignmentUpdateError,
      } = await supabaseAdmin
        .from("task_assignments")
        .update({
          mentor_score: mentorScore,
          status: nextStatus,
          completed_at: now,
        })
        .eq("id", assignmentId)
        .eq("student_id", studentId);

      if (assignmentUpdateError) {
        throw assignmentUpdateError;
      }
    } else {
      /*
       * General feedback is not linked to a task.
       * Multiple general feedback records are allowed.
       */
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("mentor_feedback")
        .insert(feedbackRecord)
        .select()
        .single();

      if (error) {
        throw error;
      }

      savedFeedback = data;
    }

    return NextResponse.json({
      success: true,

      message: assignmentId
        ? decision === "approved"
          ? "Task approved successfully"
          : "Task review saved successfully"
        : "Feedback sent successfully",

      feedback: savedFeedback,
    });
  } catch (error) {
    console.error(
      "Save mentor feedback error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save mentor feedback",
      },
      { status: 500 },
    );
  }
}