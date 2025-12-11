-- Add profile picture and gallery images for caterers
-- This script adds image storage capabilities for caterer profiles

-- Add profile picture and gallery fields to caterers table
ALTER TABLE caterers 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create a dedicated table for caterer images with metadata
CREATE TABLE IF NOT EXISTS caterer_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES caterers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('profile', 'cover', 'gallery', 'logo', 'menu_item')),
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  file_size INTEGER, -- in bytes
  file_type TEXT, -- mime type
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for caterer images
CREATE INDEX IF NOT EXISTS idx_caterer_images_caterer ON caterer_images(caterer_id);
CREATE INDEX IF NOT EXISTS idx_caterer_images_type ON caterer_images(image_type);
CREATE INDEX IF NOT EXISTS idx_caterer_images_primary ON caterer_images(caterer_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_caterer_images_order ON caterer_images(caterer_id, display_order);

-- Add trigger for caterer_images table
DROP TRIGGER IF EXISTS update_caterer_images_updated_at ON caterer_images;
CREATE TRIGGER update_caterer_images_updated_at 
BEFORE UPDATE ON caterer_images 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary image per type per caterer
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If this image is being set as primary, unset all other primary images of the same type for this caterer
  IF NEW.is_primary = TRUE THEN
    UPDATE caterer_images 
    SET is_primary = FALSE, updated_at = NOW()
    WHERE caterer_id = NEW.caterer_id 
      AND image_type = NEW.image_type 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single primary image
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON caterer_images;
CREATE TRIGGER ensure_single_primary_image_trigger
BEFORE INSERT OR UPDATE ON caterer_images
FOR EACH ROW
WHEN (NEW.is_primary = TRUE)
EXECUTE FUNCTION ensure_single_primary_image();

-- Function to update caterer profile picture URL when primary profile image changes
CREATE OR REPLACE FUNCTION sync_caterer_profile_picture()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the caterers table with the new primary profile image
  IF NEW.image_type = 'profile' AND NEW.is_primary = TRUE THEN
    UPDATE caterers 
    SET profile_picture_url = NEW.image_url, updated_at = NOW()
    WHERE id = NEW.caterer_id;
  END IF;
  
  -- Update cover image
  IF NEW.image_type = 'cover' AND NEW.is_primary = TRUE THEN
    UPDATE caterers 
    SET cover_image_url = NEW.image_url, updated_at = NOW()
    WHERE id = NEW.caterer_id;
  END IF;
  
  -- Update logo
  IF NEW.image_type = 'logo' AND NEW.is_primary = TRUE THEN
    UPDATE caterers 
    SET logo_url = NEW.image_url, updated_at = NOW()
    WHERE id = NEW.caterer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync profile picture
DROP TRIGGER IF EXISTS sync_caterer_profile_picture_trigger ON caterer_images;
CREATE TRIGGER sync_caterer_profile_picture_trigger
AFTER INSERT OR UPDATE ON caterer_images
FOR EACH ROW
EXECUTE FUNCTION sync_caterer_profile_picture();

-- Function to get caterer images by type
CREATE OR REPLACE FUNCTION get_caterer_images(
  caterer_uuid UUID,
  img_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  image_url TEXT,
  image_type TEXT,
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER,
  is_primary BOOLEAN,
  uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.image_url,
    ci.image_type,
    ci.alt_text,
    ci.caption,
    ci.display_order,
    ci.is_primary,
    ci.uploaded_at
  FROM caterer_images ci
  WHERE ci.caterer_id = caterer_uuid
    AND (img_type IS NULL OR ci.image_type = img_type)
  ORDER BY ci.display_order ASC, ci.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to delete image and clean up references
CREATE OR REPLACE FUNCTION delete_caterer_image(image_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  img_record RECORD;
BEGIN
  -- Get image details before deletion
  SELECT caterer_id, image_type, is_primary, image_url 
  INTO img_record
  FROM caterer_images 
  WHERE id = image_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Delete the image record
  DELETE FROM caterer_images WHERE id = image_uuid;
  
  -- If it was a primary image, clear the corresponding field in caterers table
  IF img_record.is_primary THEN
    CASE img_record.image_type
      WHEN 'profile' THEN
        UPDATE caterers SET profile_picture_url = NULL WHERE id = img_record.caterer_id;
      WHEN 'cover' THEN
        UPDATE caterers SET cover_image_url = NULL WHERE id = img_record.caterer_id;
      WHEN 'logo' THEN
        UPDATE caterers SET logo_url = NULL WHERE id = img_record.caterer_id;
    END CASE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a view for caterer profiles with their primary images
CREATE OR REPLACE VIEW caterer_profiles_with_images AS
SELECT 
  c.*,
  profile_img.image_url as profile_image_url,
  profile_img.alt_text as profile_image_alt,
  cover_img.image_url as cover_image_url,
  cover_img.alt_text as cover_image_alt,
  logo_img.image_url as logo_image_url,
  logo_img.alt_text as logo_image_alt,
  (
    SELECT COUNT(*) 
    FROM caterer_images ci 
    WHERE ci.caterer_id = c.id AND ci.image_type = 'gallery'
  ) as gallery_count
FROM caterers c
LEFT JOIN caterer_images profile_img ON c.id = profile_img.caterer_id 
  AND profile_img.image_type = 'profile' 
  AND profile_img.is_primary = TRUE
LEFT JOIN caterer_images cover_img ON c.id = cover_img.caterer_id 
  AND cover_img.image_type = 'cover' 
  AND cover_img.is_primary = TRUE
LEFT JOIN caterer_images logo_img ON c.id = logo_img.caterer_id 
  AND logo_img.image_type = 'logo' 
  AND logo_img.is_primary = TRUE;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO caterer_images (caterer_id, image_url, image_type, alt_text, is_primary)
-- SELECT 
--   id,
--   '/placeholder-caterer-profile.jpg',
--   'profile',
--   business_name || ' profile picture',
--   TRUE
-- FROM caterers 
-- WHERE profile_picture_url IS NULL
-- LIMIT 5;