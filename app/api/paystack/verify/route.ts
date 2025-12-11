import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 })
    }

    // Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment not successful" })
    }

    const supabase = await createClient()
    const { metadata } = data.data

    // Update caterer subscription if metadata exists
    if (metadata?.caterer_id && metadata?.tier) {
      await supabase
        .from("caterers")
        .update({
          subscription_tier: metadata.tier,
          subscription_status: "active",
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          jobs_received_this_month: 0,
        })
        .eq("id", metadata.caterer_id)

      // Update transaction log
      await supabase
        .from("subscription_transactions")
        .update({
          status: "success",
          paystack_transaction_id: data.data.id?.toString(),
        })
        .eq("paystack_reference", reference)
    }

    return NextResponse.json({ success: true, data: data.data })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
