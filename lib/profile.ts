import { supabase } from "@/lib/supabaseClient";

type AutoAssignResult = {
  assigned: boolean;
  message: string;
  mentor?: {
    id: string;
    name: string | null;
  };
};

async function autoAssignMentor(): Promise<AutoAssignResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return {
      assigned: false,
      message: "No active session found for mentor assignment.",
    };
  }

  try {
    const response = await fetch("/api/mentor/auto-assign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn(
        "Mentor auto-assignment was not completed:",
        result.error
      );

      return {
        assigned: false,
        message:
          result.error ||
          "Student profile created, but mentor assignment failed.",
      };
    }

    return {
      assigned: true,
      message:
        result.message || "Mentor assigned successfully.",
      mentor: result.mentor,
    };
  } catch (error) {
    console.error("Mentor auto-assignment error:", error);

    return {
      assigned: false,
      message:
        "Student profile created, but mentor assignment could not be completed.",
    };
  }
}

export async function createUserProfile(
  userId: string,
  fullName: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      full_name: fullName.trim(),
      role: "student",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    throw error;
  }

  // Run only after the student profile has been created.
  const mentorAssignment = await autoAssignMentor();

  return {
    profile,
    mentorAssignment,
  };
}

export async function getUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}