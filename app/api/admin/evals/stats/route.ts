import { NextResponse } from "next/server"
import { getLocationStats } from "@/lib/ai/evals"

export async function GET() {
  try {
    const stats = await getLocationStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to get location stats:", error)
    return NextResponse.json({}, { status: 200 })
  }
}
