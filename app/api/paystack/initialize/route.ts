import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SUBSCRIPTION_TIERS } from "@/lib/constants"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tier, planCode } = await request.json()

    if (!tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]

    // Get caterer profile
    const { data: caterer } = await supabase
      .from("caterers")
      .select("id, profile_id")
      .eq("profile_id", user.id)
      .single()

    if (!caterer) {
      return NextResponse.json({ error: "Caterer profile not found" }, { status: 404 })
    }

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: tierConfig.price,
        currency: "ZAR",
        plan: planCode, // Paystack plan code for subscription
        callback_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/caterer/subscription/callback`,
        metadata: {
          caterer_id: caterer.id,
          tier: tier,
          custom_fields: [
            {
              display_name: "Subscription Tier",
              variable_name: "subscription_tier",
              value: tierConfig.name,
            },
          ],
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Failed to initialize payment" }, { status: 400 })
    }

    // Log the transaction
    await supabase.from("subscription_transactions").insert({
      caterer_id: caterer.id,
      paystack_reference: data.data.reference,
      amount_cents: tierConfig.price,
      status: "pending",
      event_type: "initialize",
      metadata: { tier, authorization_url: data.data.authorization_url },
    })

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    })
  } catch (error) {
    console.error("Paystack initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}
