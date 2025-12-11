import { NextResponse } from "next/server"
import { getAllLearnedLocations, learnLocation, deleteLearnedLocation } from "@/lib/ai/evals"

export async function GET() {
  try {
    const locations = await getAllLearnedLocations()
    return NextResponse.json(locations)
  } catch (error) {
    console.error("Failed to get learned locations:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await learnLocation({
      alias: body.alias.toLowerCase().trim(),
      city: body.city,
      province: body.province,
      lat: body.lat,
      lng: body.lng,
      useCount: 0,
      lastUsed: Date.now(),
      addedBy: "admin",
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to add learned location:", error)
    return NextResponse.json({ error: "Failed to add location" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const alias = searchParams.get("alias")
    if (alias) {
      await deleteLearnedLocation(alias)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete learned location:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}
