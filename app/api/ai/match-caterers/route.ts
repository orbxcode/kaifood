import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const matchResultSchema = z.object({
  rankings: z.array(
    z.object({
      catererId: z.string(),
      score: z.number().min(0).max(100),
      reasons: z.array(z.string()).describe("Why this caterer is a good match"),
      concerns: z.array(z.string()).optional().describe("Potential concerns or limitations"),
    }),
  ),
  summary: z.string().describe("Brief summary of the matching results"),
})

export async function POST(req: Request) {
  const { requestId } = await req.json()

  const supabase = await createClient()

  // Fetch the event request
  const { data: request, error: requestError } = await supabase
    .from("event_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (requestError || !request) {
    return Response.json({ error: "Request not found" }, { status: 404 })
  }

  // Fetch potential caterers based on location and basic criteria
  const { data: caterers, error: caterersError } = await supabase
    .from("caterers")
    .select("*")
    .eq("is_active", true)
    .gte("max_guests", request.guest_count)
    .lte("min_price_per_person", request.budget_max / request.guest_count)

  if (caterersError || !caterers?.length) {
    return Response.json({ error: "No caterers found", caterers: [] })
  }

  // Use AI to intelligently rank the caterers
  const { object } = await generateObject({
    model: "openai/gpt-5",
    schema: matchResultSchema,
    prompt: `You are an expert catering matchmaker. Analyze this event request and rank the available caterers.

EVENT REQUEST:
- Event Type: ${request.event_type}
- Guest Count: ${request.guest_count}
- Date: ${request.event_date}
- Location: ${request.city}, ${request.state}
- Cuisines Wanted: ${request.cuisines?.join(", ")}
- Dietary Requirements: ${request.dietary_requirements?.join(", ")}
- Service Style: ${request.service_style}
- Budget: $${request.budget_min} - $${request.budget_max}
- Special Requests: ${request.special_requests || "None"}

AVAILABLE CATERERS:
${caterers
  .map(
    (c, i) => `
${i + 1}. ${c.business_name} (ID: ${c.id})
   - Cuisines: ${c.cuisines?.join(", ")}
   - Services: ${c.service_styles?.join(", ")}
   - Capacity: ${c.min_guests}-${c.max_guests} guests
   - Price: $${c.min_price_per_person}-$${c.max_price_per_person}/person
   - Rating: ${c.average_rating || "New"}
   - Description: ${c.description?.substring(0, 200)}
`,
  )
  .join("\n")}

Rank ALL caterers by match quality. Consider:
1. Cuisine alignment with request
2. Ability to accommodate dietary requirements
3. Service style match
4. Capacity fit for guest count
5. Price alignment with budget
6. Overall suitability for event type

Return scores from 0-100 and specific reasons for each ranking.`,
  })

  // Store matches in the database
  for (const ranking of object.rankings) {
    await supabase.from("matches").upsert(
      {
        request_id: requestId,
        caterer_id: ranking.catererId,
        match_score: ranking.score,
        match_reasons: ranking.reasons,
        status: ranking.score >= 70 ? "pending" : "low_match",
      },
      {
        onConflict: "request_id,caterer_id",
      },
    )
  }

  // Update request status
  await supabase.from("event_requests").update({ status: "matched" }).eq("id", requestId)

  return Response.json({
    matches: object.rankings,
    summary: object.summary,
    totalCaterers: caterers.length,
  })
}
