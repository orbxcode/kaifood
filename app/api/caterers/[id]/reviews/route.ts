import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const catererId = params.id;

    // Get reviews with reviewer details
    const { data: reviews, error: reviewsError } = await supabase
      .from('caterer_reviews_with_details')
      .select('*')
      .eq('caterer_id', catererId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Failed to fetch reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get caterer rating summary
    const { data: caterer, error: catererError } = await supabase
      .from('caterers')
      .select('rating, total_reviews')
      .eq('id', catererId)
      .single();

    if (catererError) {
      console.error('Failed to fetch caterer:', catererError);
      return NextResponse.json({ error: 'Failed to fetch caterer' }, { status: 500 });
    }

    return NextResponse.json({
      reviews: reviews || [],
      averageRating: caterer?.rating || 0,
      totalReviews: caterer?.total_reviews || 0,
    });

  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const catererId = params.id;
    const body = await request.json();

    // Validate required fields
    if (!body.overall_rating || !body.content) {
      return NextResponse.json({ 
        error: 'Overall rating and content are required' 
      }, { status: 400 });
    }

    // Check if user has a completed booking with this caterer
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        event_requests!inner (
          customer_id
        )
      `)
      .eq('caterer_id', catererId)
      .eq('event_requests.customer_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (matchError || !match) {
      return NextResponse.json({ 
        error: 'You can only review caterers you have booked' 
      }, { status: 403 });
    }

    // Check if user has already reviewed this caterer
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('match_id', match.id)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already reviewed this caterer' 
      }, { status: 409 });
    }

    // Create the review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        match_id: match.id,
        reviewer_id: user.id,
        caterer_id: catererId,
        overall_rating: body.overall_rating,
        food_quality_rating: body.food_quality_rating,
        service_rating: body.service_rating,
        punctuality_rating: body.punctuality_rating,
        value_rating: body.value_rating,
        presentation_rating: body.presentation_rating,
        title: body.title,
        content: body.content,
        pros: body.pros,
        cons: body.cons,
        event_type: body.event_type,
        guest_count: body.guest_count,
        event_date: body.event_date,
        status: 'approved', // Auto-approve for now, can add moderation later
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create review:', insertError);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({ review });

  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}