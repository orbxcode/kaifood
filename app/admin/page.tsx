import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Check if user is admin (you can customize this check)
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // For now, allow any authenticated user to view admin (you should add proper admin check)
  // In production, add an is_admin column to profiles table

  // Fetch all data
  const [
    { data: profiles, count: profilesCount },
    { data: caterers, count: caterersCount },
    { data: requests, count: requestsCount },
    { data: matches, count: matchesCount },
    { data: messages, count: messagesCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(50),
    supabase
      .from("caterers")
      .select("*, profile:profiles(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("event_requests")
      .select("*, customer:profiles(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("matches")
      .select("*, caterer:caterers(*, profile:profiles(*)), event_request:event_requests(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("messages").select("*", { count: "exact" }),
  ])

  return (
    <AdminDashboard
      profiles={profiles || []}
      caterers={caterers || []}
      requests={requests || []}
      matches={matches || []}
      counts={{
        profiles: profilesCount || 0,
        caterers: caterersCount || 0,
        requests: requestsCount || 0,
        matches: matchesCount || 0,
        messages: messagesCount || 0,
      }}
    />
  )
}
