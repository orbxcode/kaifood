import { generateText } from "ai"

export async function POST(req: Request) {
  const { text } = await req.json()

  // Generate a semantic summary that can be used for vector similarity
  const { text: summary } = await generateText({
    model: "openai/gpt-5-mini",
    prompt: `Create a dense, keyword-rich summary (max 500 chars) for semantic search matching. 
Include: cuisine types, event specialties, dietary capabilities, service styles, and price tier.

Profile to summarize:
${text}

Output only the summary, no explanations.`,
    maxOutputTokens: 200,
  })

  return Response.json({ summary })
}
