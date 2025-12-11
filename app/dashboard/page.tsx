import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  // Redirect based on user type
  if (profile?.user_type === "caterer") {
    redirect("/caterer/dashboard")
  } else {
    redirect("/customer/dashboard")
  }
}
