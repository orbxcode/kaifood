import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RequestDetailsView } from "@/components/customer/request-details-view"

export default async function RequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get the request with matches
  const { data: request } = await supabase
    .from("event_requests")
    .select(`
      *,
      matches:matches(
        *,
        caterer:caterers(
          *,
          profile:profiles(full_name, avatar_url, email, phone)
        )
      )
    `)
    .eq("id", id)
    .eq("customer_id", user.id)
    .single()

  if (!request) {
    notFound()
  }

  // Sort matches by overall score
  const sortedMatches =
    request.matches?.sort(
      (a: { overall_score: number }, b: { overall_score: number }) => b.overall_score - a.overall_score,
    ) || []

  return <RequestDetailsView request={{ ...request, matches: sortedMatches }} />
}
