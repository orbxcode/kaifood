import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    
    // Verify user owns this caterer profile or is admin
    const { data: caterer, error: catererError } = await supabase
      .from('caterers')
      .select('profile_id')
      .eq('id', catererId)
      .single();

    if (catererError || !caterer) {
      return NextResponse.json({ error: 'Caterer not found' }, { status: 404 });
    }

    // Check if user owns this caterer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (caterer.profile_id !== user.id && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('imageType') as string || 'gallery';
    const altText = formData.get('altText') as string || '';
    const caption = formData.get('caption') as string || '';
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `caterer-${catererId}-${imageType}-${Date.now()}.${fileExtension}`;
    const filePath = `caterers/${catererId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload image' 
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // Get image dimensions (you might want to use a library like sharp for this)
    const imageBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    
    // For now, we'll store basic info. You can enhance this with actual dimension detection
    const imageMetadata = {
      width: null,
      height: null,
      file_size: file.size,
      file_type: file.type
    };

    // Save image record to database
    const { data: imageRecord, error: dbError } = await supabase
      .from('caterer_images')
      .insert({
        caterer_id: catererId,
        image_url: publicUrl,
        image_type: imageType,
        alt_text: altText,
        caption: caption,
        is_primary: isPrimary,
        file_size: imageMetadata.file_size,
        file_type: imageMetadata.file_type,
        width: imageMetadata.width,
        height: imageMetadata.height
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('images').remove([filePath]);
      return NextResponse.json({ 
        error: 'Failed to save image record' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      image: imageRecord,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const catererId = params.id;
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type');

    // Get caterer images
    const query = supabase
      .from('caterer_images')
      .select('*')
      .eq('caterer_id', catererId)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false });

    if (imageType) {
      query.eq('image_type', imageType);
    }

    const { data: images, error } = await query;

    if (error) {
      console.error('Failed to fetch images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: caterer, error: catererError } = await supabase
      .from('caterers')
      .select('profile_id')
      .eq('id', catererId)
      .single();

    if (catererError || !caterer) {
      return NextResponse.json({ error: 'Caterer not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (caterer.profile_id !== user.id && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get image details before deletion
    const { data: image, error: imageError } = await supabase
      .from('caterer_images')
      .select('image_url')
      .eq('id', imageId)
      .eq('caterer_id', catererId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Extract file path from URL
    const url = new URL(image.image_url);
    const filePath = url.pathname.split('/').slice(-3).join('/'); // Get last 3 parts of path

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database using the helper function
    const { error: dbError } = await supabase
      .rpc('delete_caterer_image', { image_uuid: imageId });

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to delete image record' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}