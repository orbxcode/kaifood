import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CatererProfileView } from "@/components/caterer/caterer-profile-view"

export default async function CatererProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: caterer } = await supabase.from("caterers").select("*, profile:profiles(*)").eq("id", id).single()

  if (!caterer) redirect("/")

  // Get reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles(*)")
    .eq("caterer_id", id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("caterer_id", id)
    .eq("is_available", true)

  // Check if current user is logged in and has an active request
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let activeMatch = null
  if (user) {
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("caterer_id", id)
      .in("status", ["pending", "viewed", "contacted", "quoted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    activeMatch = match
  }

  return (
    <CatererProfileView
      caterer={caterer}
      reviews={reviews || []}
      menuItems={menuItems || []}
      activeMatch={activeMatch}
      isLoggedIn={!!user}
    />
  )
}
