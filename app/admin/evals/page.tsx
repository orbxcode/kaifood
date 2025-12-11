import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EvalsAdminDashboard } from "@/components/admin/evals-dashboard"

export default async function EvalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin (you'd want to add an is_admin field to profiles)
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  // For now, allow any authenticated user - in production, check for admin role
  // if (profile?.user_type !== 'admin') redirect('/dashboard')

  return <EvalsAdminDashboard />
}
