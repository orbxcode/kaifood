import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CatererDashboard } from "@/components/caterer/caterer-dashboard"

export default async function CatererDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "caterer") {
    redirect("/customer/dashboard")
  }

  // Get caterer profile
  const { data: caterer } = await supabase.from("caterers").select("*").eq("profile_id", user.id).single()

  // Get matches for this caterer
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      event_request:event_requests(
        *,
        customer:profiles!event_requests_customer_id_fkey(full_name, avatar_url, email)
      )
    `)
    .eq("caterer_id", caterer?.id)
    .order("created_at", { ascending: false })

  return <CatererDashboard profile={profile} caterer={caterer} matches={matches || []} />
}
