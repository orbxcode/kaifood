import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { Index } from "@upstash/vector"

// Initialize Upstash Vector
const vectorIndex = new Index({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const { catererId } = await request.json()

    if (!catererId) {
      return NextResponse.json({ error: "Caterer ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get caterer data
    const { data: caterer } = await supabase
      .from("caterers")
      .select("*, profile:profiles(*)")
      .eq("id", catererId)
      .single()

    if (!caterer) {
      return NextResponse.json({ error: "Caterer not found" }, { status: 404 })
    }

    // Create a text representation of the caterer for embedding
    const catererText = `
      Business: ${caterer.business_name}
      Description: ${caterer.description || ""}
      Cuisines: ${caterer.cuisine_types?.join(", ") || "Various"}
      Dietary Options: ${caterer.dietary_capabilities?.join(", ") || "Standard"}
      Service Styles: ${caterer.service_styles?.join(", ") || "Various"}
      Event Types: ${caterer.event_types?.join(", ") || "All events"}
      Capacity: ${caterer.min_guests} to ${caterer.max_guests} guests
      Price Range: R${caterer.price_range_min || 0} - R${caterer.price_range_max || 1000} per person
      Location: ${caterer.city || ""}, ${caterer.state || ""}
    `.trim()

    // Extract structured attributes using AI
    const { text: extractedJson } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Extract structured attributes from this caterer profile. Return a JSON object with: specialties (array), signature_dishes (array), unique_selling_points (array), ideal_event_sizes (string), price_tier (budget/mid-range/premium/luxury).

Profile:
${catererText}

Return only valid JSON, no explanation.`,
    })

    let extractedAttributes = {}
    try {
      extractedAttributes = JSON.parse(extractedJson)
    } catch {
      console.error("Failed to parse extracted attributes")
    }

    // Upsert vector embedding
    const embeddingId = `caterer_${catererId}`

    await vectorIndex.upsert({
      id: embeddingId,
      data: catererText,
      metadata: {
        type: "caterer",
        catererId,
        businessName: caterer.business_name,
        city: caterer.city,
        cuisineTypes: caterer.cuisine_types,
        dietaryCapabilities: caterer.dietary_capabilities,
      },
    })

    // Update caterer with extracted attributes and embedding ID
    await supabase
      .from("caterers")
      .update({
        extracted_attributes: extractedAttributes,
        embedding_id: embeddingId,
        last_extracted_at: new Date().toISOString(),
      })
      .eq("id", catererId)

    return NextResponse.json({
      success: true,
      embeddingId,
      extractedAttributes,
    })
  } catch (error) {
    console.error("Caterer extraction error:", error)
    return NextResponse.json({ error: "Failed to extract caterer data" }, { status: 500 })
  }
}
