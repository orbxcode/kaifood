import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify webhook signature
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(body).digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    const supabase = await createClient()

    switch (event.event) {
      case "charge.success": {
        const { reference, metadata, customer } = event.data
        const catererId = metadata?.caterer_id
        const tier = metadata?.tier

        if (catererId && tier) {
          // Update caterer subscription status
          await supabase
            .from("caterers")
            .update({
              subscription_tier: tier,
              subscription_status: "active",
              paystack_customer_code: customer?.customer_code,
              subscription_started_at: new Date().toISOString(),
              subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              jobs_received_this_month: 0,
            })
            .eq("id", catererId)

          // Update transaction log
          await supabase
            .from("subscription_transactions")
            .update({
              status: "success",
              paystack_transaction_id: event.data.id?.toString(),
            })
            .eq("paystack_reference", reference)
        }
        break
      }

      case "subscription.create": {
        const { customer, subscription_code, plan } = event.data

        // Find caterer by customer code and update subscription
        const { data: caterer } = await supabase
          .from("caterers")
          .select("id")
          .eq("paystack_customer_code", customer.customer_code)
          .single()

        if (caterer) {
          await supabase
            .from("caterers")
            .update({
              paystack_subscription_code: subscription_code,
              subscription_status: "active",
            })
            .eq("id", caterer.id)
        }
        break
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const { customer } = event.data

        const { data: caterer } = await supabase
          .from("caterers")
          .select("id")
          .eq("paystack_customer_code", customer.customer_code)
          .single()

        if (caterer) {
          await supabase
            .from("caterers")
            .update({
              subscription_status: "cancelled",
            })
            .eq("id", caterer.id)
        }
        break
      }

      case "invoice.payment_failed": {
        const { customer } = event.data

        const { data: caterer } = await supabase
          .from("caterers")
          .select("id")
          .eq("paystack_customer_code", customer.customer_code)
          .single()

        if (caterer) {
          await supabase
            .from("caterers")
            .update({
              subscription_status: "past_due",
            })
            .eq("id", caterer.id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
