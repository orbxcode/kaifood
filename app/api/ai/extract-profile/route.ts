import { generateObject } from "ai"
import { z } from "zod"

const catererProfileSchema = z.object({
  specialties: z.array(z.string()).describe("Main cuisine specialties"),
  eventTypes: z.array(z.string()).describe("Types of events they excel at"),
  dietaryCapabilities: z.array(z.string()).describe("Dietary accommodations offered"),
  priceRange: z.enum(["budget", "moderate", "premium", "luxury"]),
  strengths: z.array(z.string()).describe("Key strengths and selling points"),
  keywords: z.array(z.string()).describe("Searchable keywords for matching"),
})

export async function POST(req: Request) {
  const { profile } = await req.json()

  const { object } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: catererProfileSchema,
    prompt: `Analyze this caterer profile and extract structured data for matching:

Business Name: ${profile.businessName}
Description: ${profile.description}
Cuisines: ${profile.cuisines?.join(", ")}
Services: ${profile.serviceStyles?.join(", ")}
Price per person: $${profile.minPrice} - $${profile.maxPrice}
Capacity: ${profile.minGuests} - ${profile.maxGuests} guests

Extract:
- Their cuisine specialties
- What types of events they're best suited for
- Dietary accommodations they likely offer
- Their price tier
- Their key strengths
- Keywords for search matching`,
  })

  return Response.json({ extracted: object })
}
