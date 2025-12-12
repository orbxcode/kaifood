import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Paystack webhook handler for subscription updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    
    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    console.log('Paystack webhook received:', event.event, event.data)

    switch (event.event) {
      case 'subscription.create':
      case 'subscription.enable':
        await handleSubscriptionActivated(supabase, event.data)
        break
        
      case 'subscription.disable':
      case 'subscription.not_renew':
        await handleSubscriptionCancelled(supabase, event.data)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data)
        break
        
      case 'invoice.update':
        if (event.data.status === 'success') {
          await handlePaymentSuccess(supabase, event.data)
        }
        break
        
      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ status: 'success' })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionActivated(supabase: any, data: any) {
  try {
    // Find caterer by customer code
    const { data: caterer, error: findError } = await supabase
      .from('caterers')
      .select('id')
      .eq('paystack_customer_code', data.customer.customer_code)
      .single()

    if (findError || !caterer) {
      console.error('Caterer not found for customer code:', data.customer.customer_code)
      return
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('caterers')
      .update({
        subscription_status: 'active',
        paystack_subscription_code: data.subscription_code,
        subscription_started_at: data.created_at,
        subscription_expires_at: data.next_payment_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', caterer.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return
    }

    // Log transaction
    await supabase.from('subscription_transactions').insert({
      caterer_id: caterer.id,
      paystack_reference: data.reference || data.subscription_code,
      paystack_transaction_id: data.id,
      amount_cents: data.amount,
      status: 'success',
      event_type: 'subscription.activate',
      metadata: data
    })

    console.log('Subscription activated for caterer:', caterer.id)
    
  } catch (error) {
    console.error('Error handling subscription activation:', error)
  }
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  try {
    // Find caterer by subscription code
    const { data: caterer, error: findError } = await supabase
      .from('caterers')
      .select('id')
      .eq('paystack_subscription_code', data.subscription_code)
      .single()

    if (findError || !caterer) {
      console.error('Caterer not found for subscription code:', data.subscription_code)
      return
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('caterers')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', caterer.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return
    }

    // Log transaction
    await supabase.from('subscription_transactions').insert({
      caterer_id: caterer.id,
      paystack_reference: data.subscription_code,
      amount_cents: 0,
      status: 'success',
      event_type: 'subscription.cancel',
      metadata: data
    })

    console.log('Subscription cancelled for caterer:', caterer.id)
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function handlePaymentFailed(supabase: any, data: any) {
  try {
    // Find caterer by subscription
    const { data: caterer, error: findError } = await supabase
      .from('caterers')
      .select('id')
      .eq('paystack_subscription_code', data.subscription.subscription_code)
      .single()

    if (findError || !caterer) {
      console.error('Caterer not found for subscription:', data.subscription.subscription_code)
      return
    }

    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from('caterers')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', caterer.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return
    }

    // Log failed transaction
    await supabase.from('subscription_transactions').insert({
      caterer_id: caterer.id,
      paystack_reference: data.reference,
      paystack_transaction_id: data.id,
      amount_cents: data.amount,
      status: 'failed',
      event_type: 'payment.failed',
      metadata: data
    })

    console.log('Payment failed for caterer:', caterer.id)
    
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentSuccess(supabase: any, data: any) {
  try {
    // Find caterer by subscription
    const { data: caterer, error: findError } = await supabase
      .from('caterers')
      .select('id, subscription_expires_at')
      .eq('paystack_subscription_code', data.subscription.subscription_code)
      .single()

    if (findError || !caterer) {
      console.error('Caterer not found for subscription:', data.subscription.subscription_code)
      return
    }

    // Calculate next payment date (add 1 month to current expiry)
    const currentExpiry = new Date(caterer.subscription_expires_at || new Date())
    const nextPaymentDate = new Date(currentExpiry)
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

    // Update subscription status and expiry
    const { error: updateError } = await supabase
      .from('caterers')
      .update({
        subscription_status: 'active',
        subscription_expires_at: nextPaymentDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', caterer.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return
    }

    // Log successful transaction
    await supabase.from('subscription_transactions').insert({
      caterer_id: caterer.id,
      paystack_reference: data.reference,
      paystack_transaction_id: data.id,
      amount_cents: data.amount,
      status: 'success',
      event_type: 'payment.success',
      metadata: data
    })

    console.log('Payment successful for caterer:', caterer.id)
    
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}