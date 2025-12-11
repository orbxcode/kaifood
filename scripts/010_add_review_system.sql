-- Enhanced Review System for Caterers
-- This script creates a comprehensive review and rating system

-- Drop existing reviews table to recreate with enhanced structure
DROP TABLE IF EXISTS reviews CASCADE;

-- Create enhanced reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES caterers(id) ON DELETE CASCADE,
  
  -- Overall rating and category ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_quality_rating INTEGER CHECK (food_quality_rating >= 1 AND food_quality_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  presentation_rating INTEGER CHECK (presentation_rating >= 1 AND presentation_rating <= 5),
  
  -- Review content
  title TEXT,
  content TEXT,
  pros TEXT,
  cons TEXT,
  
  -- Event details
  event_type TEXT,
  guest_count INTEGER,
  event_date DATE,
  
  -- Review metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Admin moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  
  -- Response from caterer
  caterer_response TEXT,
  caterer_response_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id)
);

-- Create review images table for photo reviews
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create review helpfulness votes
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, voter_id)
);

-- Create FAQ table for the FAQ system
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create FAQ votes table
CREATE TABLE IF NOT EXISTS faq_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faq_id UUID NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),
  is_helpful BOOLEAN NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faq_id, voter_id),
  UNIQUE(faq_id, ip_address) -- Prevent duplicate votes from same IP if not logged in
);

-- Add social media links to caterers table
ALTER TABLE caterers 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_caterer ON reviews(caterer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faq_votes_faq ON faq_votes(faq_id);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at 
BEFORE UPDATE ON reviews 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at 
BEFORE UPDATE ON faqs 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update caterer rating when reviews change
CREATE OR REPLACE FUNCTION update_caterer_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update caterer's average rating and review count
  UPDATE caterers 
  SET 
    rating = (
      SELECT ROUND(AVG(overall_rating)::numeric, 2)
      FROM reviews 
      WHERE caterer_id = COALESCE(NEW.caterer_id, OLD.caterer_id)
      AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE caterer_id = COALESCE(NEW.caterer_id, OLD.caterer_id)
      AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.caterer_id, OLD.caterer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update caterer rating
DROP TRIGGER IF EXISTS update_caterer_rating_trigger ON reviews;
CREATE TRIGGER update_caterer_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_caterer_rating();

-- Function to update review helpfulness counts
CREATE OR REPLACE FUNCTION update_review_helpfulness()
RETURNS TRIGGER AS $$
BEGIN
  -- Update review helpfulness counts
  UPDATE reviews 
  SET 
    helpful_count = (
      SELECT COUNT(*) FROM review_votes 
      WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
      AND is_helpful = TRUE
    ),
    not_helpful_count = (
      SELECT COUNT(*) FROM review_votes 
      WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
      AND is_helpful = FALSE
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update review helpfulness
DROP TRIGGER IF EXISTS update_review_helpfulness_trigger ON review_votes;
CREATE TRIGGER update_review_helpfulness_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpfulness();

-- Function to update FAQ helpfulness counts
CREATE OR REPLACE FUNCTION update_faq_helpfulness()
RETURNS TRIGGER AS $$
BEGIN
  -- Update FAQ helpfulness counts
  UPDATE faqs 
  SET 
    helpful_count = (
      SELECT COUNT(*) FROM faq_votes 
      WHERE faq_id = COALESCE(NEW.faq_id, OLD.faq_id) 
      AND is_helpful = TRUE
    ),
    not_helpful_count = (
      SELECT COUNT(*) FROM faq_votes 
      WHERE faq_id = COALESCE(NEW.faq_id, OLD.faq_id) 
      AND is_helpful = FALSE
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.faq_id, OLD.faq_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update FAQ helpfulness
DROP TRIGGER IF EXISTS update_faq_helpfulness_trigger ON faq_votes;
CREATE TRIGGER update_faq_helpfulness_trigger
AFTER INSERT OR UPDATE OR DELETE ON faq_votes
FOR EACH ROW
EXECUTE FUNCTION update_faq_helpfulness();

-- Create view for caterer reviews with reviewer info
CREATE OR REPLACE VIEW caterer_reviews_with_details AS
SELECT 
  r.*,
  p.full_name as reviewer_name,
  p.avatar_url as reviewer_avatar,
  ARRAY(
    SELECT ri.image_url 
    FROM review_images ri 
    WHERE ri.review_id = r.id 
    ORDER BY ri.display_order, ri.created_at
  ) as review_images
FROM reviews r
JOIN profiles p ON r.reviewer_id = p.id
WHERE r.status = 'approved'
ORDER BY r.created_at DESC;

-- Insert sample FAQ data
INSERT INTO faqs (question, answer, category, tags, is_featured, created_by) VALUES
('How do I book a caterer?', 'Browse our verified caterers, request quotes, and book directly through our platform. Simply create an account, search for caterers in your area, and send booking requests.', 'Booking', ARRAY['booking', 'how-to', 'getting-started'], true, NULL),
('What types of events do you cater?', 'Our caterers handle all types of events including weddings, corporate events, birthday parties, conferences, private dinners, and more.', 'Services', ARRAY['events', 'services', 'types'], true, NULL),
('How far in advance should I book?', 'We recommend booking at least 2-4 weeks in advance for small events and 2-3 months for large events like weddings to ensure availability.', 'Booking', ARRAY['booking', 'timing', 'advance'], false, NULL),
('What is included in the catering service?', 'Services vary by caterer but typically include food preparation, delivery, setup, serving, and cleanup. Check individual caterer profiles for specific inclusions.', 'Services', ARRAY['services', 'inclusions', 'what-included'], false, NULL),
('How do payments work?', 'Most caterers require a deposit to secure your booking, with the balance due before or on the event day. Payment methods vary by caterer.', 'Payment', ARRAY['payment', 'deposit', 'billing'], false, NULL);

-- Grant necessary permissions
GRANT SELECT ON reviews TO anon;
GRANT SELECT ON caterer_reviews_with_details TO anon;
GRANT SELECT ON faqs TO anon;
GRANT ALL ON reviews, review_images, review_votes, faqs, faq_votes TO authenticated;