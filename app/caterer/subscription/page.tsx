import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubscriptionPlans } from "@/components/caterer/subscription-plans"

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "caterer") {
    redirect("/")
  }

  const { data: caterer } = await supabase.from("caterers").select("*").eq("profile_id", user.id).single()

  return <SubscriptionPlans caterer={caterer} />
}
