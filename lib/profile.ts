import { supabase } from "@/lib/supabaseClient"

export async function createUserProfile(userId: string, fullName: string) {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        full_name: fullName,
        role: "student",
      },
    ])

  if (error) {
    console.error("Error creating profile:", error)
    throw error
  }

  return data
}


export async function getUserProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return data
}