import { NextResponse } from "next/server"
import { getLocationEvals } from "@/lib/ai/evals"

export async function GET() {
  try {
    const evals = await getLocationEvals(100)
    return NextResponse.json(evals)
  } catch (error) {
    console.error("Failed to get location evals:", error)
    return NextResponse.json([], { status: 200 })
  }
}
