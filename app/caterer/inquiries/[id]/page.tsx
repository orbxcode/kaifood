import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InquiryDetailsView } from "@/components/caterer/inquiry-details-view"

export default async function InquiryDetailsPage({
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

  // Get caterer profile
  const { data: caterer } = await supabase.from("caterers").select("id").eq("profile_id", user.id).single()

  if (!caterer) {
    redirect("/customer/dashboard")
  }

  // Get the match with event request and customer details
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      event_request:event_requests(
        *,
        customer:profiles!event_requests_customer_id_fkey(id, full_name, avatar_url, email, phone)
      )
    `)
    .eq("id", id)
    .eq("caterer_id", caterer.id)
    .single()

  if (!match) {
    notFound()
  }

  // Get messages for this match
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url)
    `)
    .eq("match_id", id)
    .order("created_at", { ascending: true })

  // Mark match as viewed if pending
  if (match.status === "pending") {
    await supabase.from("matches").update({ status: "viewed" }).eq("id", id)
  }

  return <InquiryDetailsView match={match} messages={messages || []} userId={user.id} catererId={caterer.id} />
}
