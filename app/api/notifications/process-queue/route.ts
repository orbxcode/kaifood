import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid or missing authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Supabase client
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

    // Get pending email notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('email_notifications')
      .select(`
        *,
        match:matches(
          id,
          request:event_requests(
            id,
            event_name,
            event_type,
            event_date,
            guest_count,
            customer:profiles!event_requests_customer_id_fkey(
              full_name,
              email
            )
          ),
          caterer:caterers(
            id,
            business_name,
            profile:profiles!caterers_profile_id_fkey(
              full_name,
              email
            )
          )
        )
      `)
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .limit(10) // Process in batches

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ 
        message: 'No pending notifications to process',
        processed: 0 
      })
    }

    let processed = 0
    let failed = 0

    // Process each notification
    for (const notification of notifications) {
      try {
        await processNotification(supabase, notification)
        processed++
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        
        // Update retry count
        await supabase
          .from('email_notifications')
          .update({
            retry_count: notification.retry_count + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)
        
        failed++
      }
    }

    return NextResponse.json({
      message: 'Email queue processed',
      processed,
      failed,
      total: notifications.length
    })

  } catch (error) {
    console.error('Email queue processing error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function processNotification(supabase: any, notification: any) {
  const { notification_type, recipient_email, metadata, match } = notification

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  let emailData: any = {}

  switch (notification_type) {
    case 'new_match':
      emailData = await generateNewMatchEmail(notification, match)
      break
    case 'quote_request':
      emailData = await generateQuoteRequestEmail(notification, match)
      break
    case 'message':
      emailData = await generateMessageEmail(notification, match)
      break
    case 'booking_confirmed':
      emailData = await generateBookingConfirmedEmail(notification, match)
      break
    default:
      throw new Error(`Unknown notification type: ${notification_type}`)
  }

  // Send email via Resend
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'noreply@kaifood.co.za',
    to: recipient_email,
    ...emailData
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  // Update notification status
  await supabase
    .from('email_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      email_provider_id: data?.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', notification.id)

  console.log(`Email sent successfully: ${notification.id} -> ${recipient_email}`)
}

async function generateNewMatchEmail(notification: any, match: any) {
  const customerName = match?.request?.customer?.full_name || 'Customer'
  const eventName = match?.request?.event_name || 'Event'
  const eventDate = match?.request?.event_date ? new Date(match.request.event_date).toLocaleDateString() : 'TBD'
  const guestCount = match?.request?.guest_count || 'Unknown'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kaifood.co.za'

  return {
    subject: `🎉 New Catering Request: ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Catering Request!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been matched with a potential client</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Event Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Customer:</td>
                <td style="padding: 8px 0;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Event:</td>
                <td style="padding: 8px 0;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Date:</td>
                <td style="padding: 8px 0;">${eventDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Guests:</td>
                <td style="padding: 8px 0;">${guestCount}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/caterer/matches/${match?.id}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Request & Respond
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            Respond quickly to increase your chances of booking this event!
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 KaiFood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${appUrl}/unsubscribe" style="color: #ccc;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `
  }
}

async function generateQuoteRequestEmail(notification: any, match: any) {
  const customerName = match?.request?.customer?.full_name || 'Customer'
  const eventName = match?.request?.event_name || 'Event'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kaifood.co.za'

  return {
    subject: `Quote Request: ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Quote Request</h2>
        <p>Hello,</p>
        <p>${customerName} has requested a quote for their event: <strong>${eventName}</strong></p>
        <p>
          <a href="${appUrl}/caterer/matches/${match?.id}" 
             style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Provide Quote
          </a>
        </p>
        <p>Best regards,<br>KaiFood Team</p>
      </div>
    `
  }
}

async function generateMessageEmail(notification: any, match: any) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kaifood.co.za'

  return {
    subject: 'New Message - KaiFood',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Message</h2>
        <p>You have received a new message regarding your catering request.</p>
        <p>
          <a href="${appUrl}/messages/${match?.id}" 
             style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Message
          </a>
        </p>
        <p>Best regards,<br>KaiFood Team</p>
      </div>
    `
  }
}

async function generateBookingConfirmedEmail(notification: any, match: any) {
  const eventName = match?.request?.event_name || 'Event'
  const eventDate = match?.request?.event_date ? new Date(match.request.event_date).toLocaleDateString() : 'TBD'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kaifood.co.za'

  return {
    subject: `Booking Confirmed: ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed! 🎉</h2>
        <p>Great news! Your catering booking has been confirmed.</p>
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p>
          <a href="${appUrl}/bookings/${match?.id}" 
             style="background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Booking Details
          </a>
        </p>
        <p>Best regards,<br>KaiFood Team</p>
      </div>
    `
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'email-notifications'
  })
}