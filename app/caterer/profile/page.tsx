import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CatererProfileForm } from "@/components/caterer/caterer-profile-form"

export default async function CatererProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "caterer") {
    redirect("/customer/dashboard")
  }

  const { data: caterer } = await supabase.from("caterers").select("*").eq("profile_id", user.id).single()

  return <CatererProfileForm profile={profile} caterer={caterer} />
}
