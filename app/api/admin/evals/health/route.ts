import { NextResponse } from "next/server"
import { getSystemHealth } from "@/lib/ai/evals"

export async function GET() {
  try {
    const health = await getSystemHealth()
    return NextResponse.json(health)
  } catch (error) {
    console.error("Failed to get system health:", error)
    return NextResponse.json(
      {
        locationAccuracy: 0,
        matchingSuccessRate: 0,
        averageRating: 0,
        learnedLocationsCount: 0,
      },
      { status: 200 },
    )
  }
}
