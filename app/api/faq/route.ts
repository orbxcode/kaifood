import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('faqs')
      .select('*')
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('helpful_count', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: faqs, error } = await query;

    if (error) {
      console.error('Failed to fetch FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    // Get categories
    const { data: categories } = await supabase
      .from('faqs')
      .select('category')
      .eq('status', 'published');

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

    return NextResponse.json({ 
      faqs: faqs || [], 
      categories: uniqueCategories 
    });

  } catch (error) {
    console.error('FAQ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { question, answer, category, tags, is_featured } = body;

    if (!question || !answer || !category) {
      return NextResponse.json({ 
        error: 'Question, answer, and category are required' 
      }, { status: 400 });
    }

    const { data: faq, error: insertError } = await supabase
      .from('faqs')
      .insert({
        question,
        answer,
        category,
        tags: tags || [],
        is_featured: is_featured || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create FAQ:', insertError);
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('FAQ creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}