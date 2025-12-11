import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get match with all related data
  const { data: match } = await supabase
    .from("matches")
    .select(
      `
      *,
      caterer:caterers(*, profile:profiles(*)),
      event_request:event_requests(*, customer:profiles(*))
    `,
    )
    .eq("id", matchId)
    .single()

  if (!match) redirect("/dashboard")

  // Get current user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Verify user is part of this match
  const isCustomer = match.event_request?.customer_id === user.id
  const isCaterer = match.caterer?.profile_id === user.id

  if (!isCustomer && !isCaterer) redirect("/dashboard")

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*, sender:profiles(*)")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })

  // Mark messages as read
  if (messages && messages.length > 0) {
    const unreadIds = messages.filter((m) => !m.is_read && m.sender_id !== user.id).map((m) => m.id)

    if (unreadIds.length > 0) {
      await supabase.from("messages").update({ is_read: true }).in("id", unreadIds)
    }
  }

  return <ChatInterface match={match} messages={messages || []} currentUser={profile!} isCustomer={isCustomer} />
}
