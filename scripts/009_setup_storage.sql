-- Setup Supabase Storage for caterer images
-- This script creates storage buckets and policies for image uploads

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for caterer images

-- Policy: Allow authenticated users to upload images to their own caterer folder
CREATE POLICY "Caterers can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'caterers'
  AND (
    -- User owns the caterer profile
    EXISTS (
      SELECT 1 FROM caterers c
      JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
      AND c.id::text = (storage.foldername(name))[2]
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
);

-- Policy: Allow public read access to all images
CREATE POLICY "Public can view all images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Policy: Allow caterers to update their own images
CREATE POLICY "Caterers can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'caterers'
  AND (
    -- User owns the caterer profile
    EXISTS (
      SELECT 1 FROM caterers c
      JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
      AND c.id::text = (storage.foldername(name))[2]
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
);

-- Policy: Allow caterers to delete their own images
CREATE POLICY "Caterers can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'caterers'
  AND (
    -- User owns the caterer profile
    EXISTS (
      SELECT 1 FROM caterers c
      JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
      AND c.id::text = (storage.foldername(name))[2]
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
);

-- Create RLS policies for caterer_images table

-- Enable RLS on caterer_images table
ALTER TABLE caterer_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read caterer images
CREATE POLICY "Public can view caterer images" ON caterer_images
FOR SELECT USING (true);

-- Policy: Allow caterers to manage their own images
CREATE POLICY "Caterers can manage their own images" ON caterer_images
FOR ALL USING (
  auth.role() = 'authenticated'
  AND (
    -- User owns the caterer profile
    EXISTS (
      SELECT 1 FROM caterers c
      JOIN profiles p ON c.profile_id = p.id
      WHERE p.id = auth.uid()
      AND c.id = caterer_images.caterer_id
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
);

-- Grant necessary permissions
GRANT SELECT ON caterer_images TO anon, authenticated;
GRANT ALL ON caterer_images TO authenticated;

-- Create a function to get caterer profile with images for public display
CREATE OR REPLACE FUNCTION get_caterer_profile_public(caterer_uuid UUID)
RETURNS TABLE(
  id UUID,
  business_name TEXT,
  description TEXT,
  cuisine_types TEXT[],
  city TEXT,
  rating DECIMAL,
  total_reviews INTEGER,
  price_range_min DECIMAL,
  price_range_max DECIMAL,
  is_verified BOOLEAN,
  profile_picture_url TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  gallery_images JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.business_name,
    c.description,
    c.cuisine_types,
    c.city,
    c.rating,
    c.total_reviews,
    c.price_range_min,
    c.price_range_max,
    c.is_verified,
    c.profile_picture_url,
    c.cover_image_url,
    c.logo_url,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'image_url', ci.image_url,
            'alt_text', ci.alt_text,
            'caption', ci.caption,
            'display_order', ci.display_order
          ) ORDER BY ci.display_order, ci.uploaded_at
        )
        FROM caterer_images ci
        WHERE ci.caterer_id = c.id AND ci.image_type = 'gallery'
      ),
      '[]'::jsonb
    ) as gallery_images
  FROM caterers c
  WHERE c.id = caterer_uuid AND c.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_caterer_profile_public(UUID) TO anon, authenticated;