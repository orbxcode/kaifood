import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the match and verify customer owns the request
    const { data: match } = await supabase
      .from("matches")
      .select(`
        *,
        event_request:event_requests(customer_id)
      `)
      .eq("id", matchId)
      .single()

    if (!match || match.event_request?.customer_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Update match status to accepted
    await supabase.from("matches").update({ status: "accepted" }).eq("id", matchId)

    // Update request status to booked
    await supabase.from("event_requests").update({ status: "booked" }).eq("id", match.request_id)

    // Decline all other matches for this request
    await supabase.from("matches").update({ status: "declined" }).eq("request_id", match.request_id).neq("id", matchId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept match error:", error)
    return NextResponse.json({ error: "Failed to accept match" }, { status: 500 })
  }
}
