import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const faqId = params.id;
    const { helpful } = await request.json();

    if (typeof helpful !== 'boolean') {
      return NextResponse.json({ error: 'Helpful must be a boolean' }, { status: 400 });
    }

    // Get user if authenticated, otherwise use IP address
    const { data: { user } } = await supabase.auth.getUser();
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';

    // Check if user/IP has already voted
    let existingVote;
    if (user) {
      const { data } = await supabase
        .from('faq_votes')
        .select('*')
        .eq('faq_id', faqId)
        .eq('voter_id', user.id)
        .single();
      existingVote = data;
    } else {
      const { data } = await supabase
        .from('faq_votes')
        .select('*')
        .eq('faq_id', faqId)
        .eq('ip_address', clientIP)
        .single();
      existingVote = data;
    }

    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('faq_votes')
        .update({ is_helpful: helpful })
        .eq('id', existingVote.id);

      if (updateError) {
        console.error('Failed to update vote:', updateError);
        return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
      }
    } else {
      // Create new vote
      const { error: insertError } = await supabase
        .from('faq_votes')
        .insert({
          faq_id: faqId,
          voter_id: user?.id || null,
          ip_address: user ? null : clientIP,
          is_helpful: helpful,
        });

      if (insertError) {
        console.error('Failed to create vote:', insertError);
        return NextResponse.json({ error: 'Failed to create vote' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('FAQ vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}