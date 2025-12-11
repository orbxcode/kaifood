import { createClient } from "@/lib/supabase/server"
import { getTierForBudget, type SubscriptionTier } from "@/lib/constants"

export interface EligibleCaterer {
  id: string
  profile_id: string
  business_name: string
  subscription_tier: SubscriptionTier
  last_job_assigned_at: string | null
  jobs_received_this_month: number
  city: string
}

// Get the next caterer in round-robin order for a given tier and city
export async function getNextRoundRobinCaterers(
  totalBudget: number,
  city: string,
  limit = 5,
): Promise<EligibleCaterer[]> {
  const supabase = await createClient()
  const targetTier = getTierForBudget(totalBudget)
  const normalizedCity = city.toLowerCase().trim()

  // Get round-robin state for this tier/city combination
  const { data: roundRobinState } = await supabase
    .from("round_robin_state")
    .select("*")
    .eq("tier", targetTier)
    .eq("city", normalizedCity)
    .single()

  // Get all eligible caterers for this tier and city with active subscriptions
  const { data: eligibleCaterers, error } = await supabase
    .from("caterers")
    .select("id, profile_id, business_name, subscription_tier, last_job_assigned_at, jobs_received_this_month, city")
    .eq("subscription_tier", targetTier)
    .eq("subscription_status", "active")
    .eq("is_active", true)
    .ilike("city", `%${normalizedCity}%`)
    .order("last_job_assigned_at", { ascending: true, nullsFirst: true })

  if (error || !eligibleCaterers || eligibleCaterers.length === 0) {
    // Fallback: try to find caterers in nearby tiers or any active caterers
    const { data: fallbackCaterers } = await supabase
      .from("caterers")
      .select("id, profile_id, business_name, subscription_tier, last_job_assigned_at, jobs_received_this_month, city")
      .eq("subscription_status", "active")
      .eq("is_active", true)
      .ilike("city", `%${normalizedCity}%`)
      .order("last_job_assigned_at", { ascending: true, nullsFirst: true })
      .limit(limit)

    return (fallbackCaterers || []) as EligibleCaterer[]
  }

  // Round-robin selection: start from the last assigned index
  const startIndex = roundRobinState?.assignment_index || 0
  const sortedCaterers: EligibleCaterer[] = []

  // Reorder caterers starting from the round-robin index
  for (let i = 0; i < eligibleCaterers.length && sortedCaterers.length < limit; i++) {
    const index = (startIndex + i) % eligibleCaterers.length
    sortedCaterers.push(eligibleCaterers[index] as EligibleCaterer)
  }

  return sortedCaterers
}

// Update round-robin state after assigning jobs
export async function updateRoundRobinState(
  tier: SubscriptionTier,
  city: string,
  assignedCatererIds: string[],
): Promise<void> {
  const supabase = await createClient()
  const normalizedCity = city.toLowerCase().trim()

  // Get current state
  const { data: currentState } = await supabase
    .from("round_robin_state")
    .select("*")
    .eq("tier", tier)
    .eq("city", normalizedCity)
    .single()

  const newIndex = (currentState?.assignment_index || 0) + assignedCatererIds.length

  // Upsert round-robin state
  await supabase.from("round_robin_state").upsert(
    {
      tier,
      city: normalizedCity,
      last_assigned_caterer_id: assignedCatererIds[assignedCatererIds.length - 1],
      assignment_index: newIndex,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "tier,city",
    },
  )

  // Update last_job_assigned_at for assigned caterers
  await supabase
    .from("caterers")
    .update({
      last_job_assigned_at: new Date().toISOString(),
      jobs_received_this_month: supabase.rpc("increment_jobs", { caterer_ids: assignedCatererIds }),
    })
    .in("id", assignedCatererIds)
}

// Check if a caterer can receive more jobs this month based on their tier
export function canReceiveMoreJobs(tier: SubscriptionTier, currentJobsThisMonth: number): boolean {
  const limits: Record<SubscriptionTier, number | null> = {
    basic: 5,
    pro: 15,
    business: null, // unlimited
  }

  const limit = limits[tier]
  return limit === null || currentJobsThisMonth < limit
}
