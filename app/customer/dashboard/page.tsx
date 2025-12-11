import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerDashboard } from "@/components/customer/customer-dashboard"

export default async function CustomerDashboardPage() {
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

  if (!profile || profile.user_type !== "customer") {
    redirect("/caterer/dashboard")
  }

  // Get customer's event requests with matches
  const { data: requests } = await supabase
    .from("event_requests")
    .select(`
      *,
      matches:matches(
        *,
        caterer:caterers(
          *,
          profile:profiles(full_name, avatar_url)
        )
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  return <CustomerDashboard profile={profile} requests={requests || []} />
}
