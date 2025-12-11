import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateDistance } from "@/lib/ai/matching"
import { getTierForBudget, SA_CITIES } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()
    console.log("[v0] Matching trigger called for request:", requestId)

    if (!requestId) {
      return NextResponse.json({ error: "Request ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the event request
    const { data: eventRequest, error: fetchError } = await supabase
      .from("event_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (fetchError || !eventRequest) {
      console.error("[v0] Failed to fetch request:", fetchError)
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    console.log("[v0] Event request fetched:", eventRequest.id)

    // Update request status to matching
    await supabase.from("event_requests").update({ status: "matching" }).eq("id", requestId)

    const cityInput = eventRequest.normalized_city || eventRequest.city || ""
    const cityData = SA_CITIES.find(
      (c) => c.city.toLowerCase() === cityInput.toLowerCase() || c.aliases?.some((a) => a === cityInput.toLowerCase()),
    )

    const lat = cityData?.lat || null
    const lng = cityData?.lng || null

    console.log("[v0] City lookup:", { cityInput, found: !!cityData, lat, lng })

    // Calculate total budget
    const totalBudget =
      eventRequest.total_budget ||
      (eventRequest.budget_per_person && eventRequest.guest_count
        ? eventRequest.budget_per_person * eventRequest.guest_count
        : eventRequest.budget_max
          ? eventRequest.budget_max * eventRequest.guest_count
          : 0)

    console.log("[v0] Total budget:", totalBudget)

    const tier = getTierForBudget(totalBudget)
    console.log("[v0] Assigned tier:", tier)

    // Get all active caterers (we'll filter by tier compatibility in scoring)
    const { data: caterers, error: caterersError } = await supabase.from("caterers").select("*").eq("is_active", true)

    if (caterersError) {
      console.error("[v0] Failed to fetch caterers:", caterersError)
    }

    console.log("[v0] Found caterers:", caterers?.length || 0)

    let matchCount = 0

    if (!caterers || caterers.length === 0) {
      // No caterers - still mark as matched
      await supabase.from("event_requests").update({ status: "matched" }).eq("id", requestId)
      console.log("[v0] No caterers found, marked as matched")
    } else {
      // Score and match caterers
      const matches = scoreCaterers(eventRequest, caterers, lat, lng, tier)
      console.log("[v0] Scored matches:", matches.length)
      matchCount = matches.length

      // Insert matches
      if (matches.length > 0) {
        const matchInserts = matches.map((match, index) => ({
          request_id: requestId,
          caterer_id: match.caterer_id,
          semantic_score: match.semantic_score,
          distance_km: match.distance_km,
          distance_score: match.distance_score,
          compatibility_score: match.compatibility_score,
          overall_score: match.overall_score,
          rank: index + 1,
          match_reasons: match.match_reasons,
          status: "pending",
        }))

        const { error: matchError } = await supabase.from("matches").insert(matchInserts)

        if (matchError) {
          console.error("[v0] Failed to insert matches:", matchError)
        } else {
          console.log("[v0] Inserted", matchInserts.length, "matches")
        }
      }

      await supabase.from("event_requests").update({ status: "matched" }).eq("id", requestId)
    }

    console.log("[v0] Matching complete:", { matchCount, tier, totalBudget })

    return NextResponse.json({
      success: true,
      matchCount,
      totalBudget,
      tier,
      city: cityData?.city || cityInput,
    })
  } catch (error) {
    console.error("[v0] Matching trigger error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger matching" },
      { status: 500 },
    )
  }
}

function scoreCaterers(
  request: Record<string, unknown>,
  caterers: Record<string, unknown>[],
  requestLat: number | null,
  requestLng: number | null,
  targetTier: string,
) {
  const matches = caterers.map((caterer) => {
    let score = 0
    const reasons: Record<string, string> = {}

    // Tier compatibility bonus (caterers with matching or higher tier get priority)
    const catererTier = (caterer.subscription_tier as string) || "basic"
    const tierOrder = { basic: 1, pro: 2, business: 3 }
    const catererTierLevel = tierOrder[catererTier as keyof typeof tierOrder] || 1
    const targetTierLevel = tierOrder[targetTier as keyof typeof tierOrder] || 1

    if (catererTierLevel >= targetTierLevel) {
      score += 0.1
      reasons.tier = `${catererTier} tier caterer`
    }

    // Cuisine match (30%)
    const cuisinePrefs = (request.cuisine_preferences as string[]) || []
    const catererCuisines = (caterer.cuisine_types as string[]) || []
    const cuisineOverlap = cuisinePrefs.filter((c) => catererCuisines.includes(c)).length
    const cuisineScore = cuisinePrefs.length > 0 ? (cuisineOverlap / cuisinePrefs.length) * 0.3 : 0.15
    score += cuisineScore
    if (cuisineOverlap > 0) {
      reasons.cuisine = `Matches ${cuisineOverlap} cuisine preferences`
    }

    // Dietary match (25%)
    const dietaryReqs = (request.dietary_requirements as string[]) || []
    const catererDietary = (caterer.dietary_capabilities as string[]) || []
    const dietaryOverlap = dietaryReqs.filter((d) => catererDietary.includes(d)).length
    if (dietaryReqs.length === 0 || dietaryOverlap === dietaryReqs.length) {
      score += 0.25
      reasons.dietary = "Can accommodate all dietary requirements"
    } else if (dietaryOverlap > 0) {
      score += 0.15 * (dietaryOverlap / dietaryReqs.length)
      reasons.dietary = `Matches ${dietaryOverlap}/${dietaryReqs.length} dietary requirements`
    }

    // Capacity match (20%)
    const guestCount = request.guest_count as number
    const minGuests = (caterer.min_guests as number) || 0
    const maxGuests = (caterer.max_guests as number) || 1000
    if (guestCount >= minGuests && guestCount <= maxGuests) {
      score += 0.2
      reasons.capacity = "Guest count within capacity"
    } else if (guestCount < minGuests && guestCount >= minGuests * 0.7) {
      score += 0.1
      reasons.capacity = "Guest count slightly below minimum"
    }

    // Service style match (15%)
    const requestedStyle = request.service_style as string
    const catererStyles = (caterer.service_styles as string[]) || []
    if (requestedStyle && catererStyles.includes(requestedStyle)) {
      score += 0.15
      reasons.service = `Offers ${requestedStyle} service`
    } else if (!requestedStyle) {
      score += 0.075
    }

    // Location/Distance score (10%)
    let distanceKm = 50
    if (requestLat && requestLng && caterer.latitude && caterer.longitude) {
      distanceKm =
        calculateDistance(requestLat, requestLng, caterer.latitude as number, caterer.longitude as number) * 1.60934

      if (distanceKm <= 15) {
        score += 0.1
        reasons.location = "Within 15km"
      } else if (distanceKm <= 30) {
        score += 0.07
        reasons.location = "Within 30km"
      } else if (distanceKm <= 50) {
        score += 0.04
        reasons.location = "Within 50km"
      }
    } else {
      // Fallback: compare city names
      const catererCity = ((caterer.city as string) || "").toLowerCase()
      const requestCity = ((request.normalized_city as string) || (request.city as string) || "").toLowerCase()
      if (catererCity && requestCity && (catererCity.includes(requestCity) || requestCity.includes(catererCity))) {
        score += 0.1
        reasons.location = "Same city"
        distanceKm = 10
      }
    }

    return {
      caterer_id: caterer.id as string,
      semantic_score: cuisineScore + (dietaryOverlap > 0 ? 0.1 : 0),
      distance_km: Math.round(distanceKm * 10) / 10,
      distance_score: distanceKm <= 30 ? 0.9 : distanceKm <= 50 ? 0.7 : 0.5,
      compatibility_score: Math.round(score * 100) / 100,
      overall_score: Math.round(score * 100) / 100,
      match_reasons: reasons,
    }
  })

  // Sort by score and return top matches
  return matches
    .filter((m) => m.overall_score > 0.1)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 10)
}
