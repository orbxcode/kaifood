import { generateObject } from "ai"
import { z } from "zod"
import { normalizeLocation } from "@/lib/constants"
import { logLocationEval, getLearnedLocation, learnLocation, incrementLocationUse } from "@/lib/ai/evals"

const LocationSchema = z.object({
  city: z.string().describe("The standardized city name"),
  province: z.string().describe("The South African province"),
  latitude: z.number().describe("Approximate latitude coordinate"),
  longitude: z.number().describe("Approximate longitude coordinate"),
  confidence: z.enum(["high", "medium", "low"]).describe("Confidence in the location match"),
  originalInput: z.string().describe("The original user input"),
})

export type NormalizedLocation = z.infer<typeof LocationSchema>

export async function normalizeLocationWithAI(input: string): Promise<NormalizedLocation> {
  const cleanInput = input.toLowerCase().trim()

  const learnedMatch = await getLearnedLocation(cleanInput)
  if (learnedMatch) {
    await incrementLocationUse(cleanInput)
    const result: NormalizedLocation = {
      city: learnedMatch.city,
      province: learnedMatch.province,
      latitude: learnedMatch.lat,
      longitude: learnedMatch.lng,
      confidence: "high",
      originalInput: input,
    }

    // Log eval for tracking
    await logLocationEval({
      input,
      normalizedCity: result.city,
      normalizedProvince: result.province,
      confidence: "high",
      source: "learned",
    })

    return result
  }

  // Step 2: Try exact match from static aliases
  const exactMatch = normalizeLocation(input)
  if (exactMatch) {
    const result: NormalizedLocation = {
      city: exactMatch.city,
      province: exactMatch.province,
      latitude: exactMatch.lat,
      longitude: exactMatch.lng,
      confidence: "high",
      originalInput: input,
    }

    // Log eval for tracking
    await logLocationEval({
      input,
      normalizedCity: result.city,
      normalizedProvince: result.province,
      confidence: "high",
      source: "alias",
    })

    return result
  }

  // Step 3: Use AI to interpret ambiguous or complex location inputs
  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: LocationSchema,
      prompt: `You are a South African location expert. Interpret the following location input and return the standardized city name, province, and approximate coordinates.

Common South African city aliases to recognize:
- "jozi", "joburg", "jhb", "egoli", "gauteng" → Johannesburg, Gauteng
- "cpt", "ct", "kaapstad", "mother city" → Cape Town, Western Cape
- "pe", "p.e.", "port elizabeth", "the bay", "windy city" → Gqeberha (formerly Port Elizabeth), Eastern Cape
- "durbs", "dbn", "ethekwini", "durban" → Durban, KwaZulu-Natal
- "pta", "tshwane", "pretoria", "jacaranda city" → Pretoria, Gauteng
- "bloem", "bfn", "bloemfontein" → Bloemfontein, Free State
- "stellies", "stellenbosch" → Stellenbosch, Western Cape
- "el", "east london", "buffalo city" → East London, Eastern Cape
- "polokwane", "pietersburg" → Polokwane, Limpopo
- "nelspruit", "mbombela" → Mbombela, Mpumalanga
- "kimberley", "diamond city" → Kimberley, Northern Cape
- "potch", "potchefstroom" → Potchefstroom, North West
- "soweto" → Johannesburg (Soweto), Gauteng
- "sandton" → Johannesburg (Sandton), Gauteng

If the input mentions a specific venue, suburb, or address, extract the main city.
If unsure, provide the best match with "low" confidence.

Location input: "${input}"`,
    })

    await logLocationEval({
      input,
      normalizedCity: object.city,
      normalizedProvince: object.province,
      confidence: object.confidence,
      source: "ai",
    })

    // If AI is confident, learn this mapping for future use
    if (object.confidence === "high" && cleanInput.length > 2) {
      await learnLocation({
        alias: cleanInput,
        city: object.city,
        province: object.province,
        lat: object.latitude,
        lng: object.longitude,
        useCount: 1,
        lastUsed: Date.now(),
        addedBy: "system",
      })
    }

    return object
  } catch (error) {
    // Fallback to a default response if AI fails
    console.error("[v0] Location normalization failed:", error)

    const fallback: NormalizedLocation = {
      city: input,
      province: "Unknown",
      latitude: -26.2041, // Default to Johannesburg
      longitude: 28.0473,
      confidence: "low",
      originalInput: input,
    }

    await logLocationEval({
      input,
      normalizedCity: fallback.city,
      normalizedProvince: fallback.province,
      confidence: "low",
      source: "ai",
    })

    return fallback
  }
}

// Calculate total budget from guest count and per-person budget or use total directly
export function calculateTotalBudget(
  guestCount: number,
  budgetPerPerson?: number | null,
  totalBudget?: number | null,
  budgetType: "per_person" | "total" = "per_person",
): number {
  if (budgetType === "total" && totalBudget) {
    return totalBudget
  }

  if (budgetPerPerson) {
    return guestCount * budgetPerPerson
  }

  if (totalBudget) {
    return totalBudget
  }

  // Default estimate based on guest count (R200 per person average)
  return guestCount * 200
}
