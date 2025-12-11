import { NextRequest, NextResponse } from 'next/server';
import { sendNewMatchNotification } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify the request is authenticated (you might want to add API key validation)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    // Get match details with related data
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
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      console.error('Failed to fetch match data:', matchError);
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Format the data for the email
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

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
    }

    // Log the notification in the database (optional)
    await supabase
      .from('admin_messages')
      .insert({
        sender_id: user.id,
        recipient_id: matchData.caterers.profiles.id,
        subject: 'New Match Notification Sent',
        content: `Email notification sent for match ${matchId}`,
        message_type: 'notification',
        metadata: {
          match_id: matchId,
          email_id: emailResult.data?.id,
          notification_type: 'new_match'
        }
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully',
      emailId: emailResult.data?.id 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}