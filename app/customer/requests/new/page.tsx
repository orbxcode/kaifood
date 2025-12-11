import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EventRequestForm } from "@/components/customer/event-request-form"

export default async function NewRequestPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "customer") {
    redirect("/caterer/dashboard")
  }

  return <EventRequestForm userId={user.id} />
}
