import { NextRequest, NextResponse } from 'next/server';
import { sendNewMatchNotification } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (cron job, webhook, etc.)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.WEBHOOK_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get pending email notifications
    const { data: pendingNotifications, error: fetchError } = await supabase
      .rpc('process_pending_email_notifications');

    if (fetchError) {
      console.error('Failed to fetch pending notifications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications', processed: 0 });
    }

    let processed = 0;
    let failed = 0;

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        if (notification.notification_type === 'new_match') {
          // Get full match details for the email
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select(`
              id,
              overall_score,
              quoted_price,
              caterers!inner (
                id,
                business_name,
                profiles!inner (
                  id,
                  email,
                  full_name
                )
              ),
              event_requests!inner (
                id,
                event_name,
                event_type,
                event_date,
                guest_count,
                venue_address,
                city,
                budget_min,
                budget_max,
                profiles!inner (
                  id,
                  full_name
                )
              )
            `)
            .eq('id', notification.match_id)
            .single();

          if (matchError || !matchData) {
            console.error(`Failed to fetch match data for ${notification.match_id}:`, matchError);
            await supabase.rpc('mark_email_notification_failed', {
              notification_id: notification.notification_id,
              error_msg: 'Match data not found'
            });
            failed++;
            continue;
          }

          // Format email data
          const emailData = {
            catererEmail: matchData.caterers.profiles.email,
            catererName: matchData.caterers.profiles.full_name || 'Caterer',
            businessName: matchData.caterers.business_name,
            customerName: matchData.event_requests.profiles.full_name || 'Customer',
            eventType: matchData.event_requests.event_type,
            eventDate: new Date(matchData.event_requests.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            guestCount: matchData.event_requests.guest_count,
            location: `${matchData.event_requests.venue_address || 'Venue TBD'}, ${matchData.event_requests.city || ''}`.trim().replace(/,$/, ''),
            budget: matchData.event_requests.budget_min && matchData.event_requests.budget_max 
              ? `R${matchData.event_requests.budget_min.toLocaleString()} - R${matchData.event_requests.budget_max.toLocaleString()}`
              : 'Budget to be discussed',
            matchId: matchData.id,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://kaicatering.com'
          };

          // Send the email
          const emailResult = await sendNewMatchNotification(emailData);

          if (emailResult.success) {
            // Mark as sent
            await supabase.rpc('mark_email_notification_sent', {
              notification_id: notification.notification_id,
              provider_email_id: emailResult.data?.id
            });
            processed++;
          } else {
            // Mark as failed
            await supabase.rpc('mark_email_notification_failed', {
              notification_id: notification.notification_id,
              error_msg: emailResult.error?.message || 'Email sending failed'
            });
            failed++;
          }
        }
      } catch (error) {
        console.error(`Failed to process notification ${notification.notification_id}:`, error);
        await supabase.rpc('mark_email_notification_failed', {
          notification_id: notification.notification_id,
          error_msg: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return NextResponse.json({ 
      message: 'Email queue processed',
      processed,
      failed,
      total: pendingNotifications.length
    });

  } catch (error) {
    console.error('Queue processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET for health checks and simple triggering
export async function GET(request: NextRequest) {
  try {
    // For GET requests, check authorization via query parameter or header
    const authHeader = request.headers.get('authorization');
    const authQuery = new URL(request.url).searchParams.get('auth');
    const expectedToken = process.env.CRON_SECRET || process.env.WEBHOOK_SECRET;
    
    const isAuthorized = 
      (authHeader && authHeader === `Bearer ${expectedToken}`) ||
      (authQuery && authQuery === expectedToken);

    if (!expectedToken || !isAuthorized) {
      return NextResponse.json({ 
        status: 'Email queue processor is running',
        message: 'Health check OK - Authentication required for processing'
      });
    }

    // If authorized, process the queue (same logic as POST)
    return POST(request);
    
  } catch (error) {
    console.error('GET queue processing error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Health check failed'
    }, { status: 500 });
  }
}