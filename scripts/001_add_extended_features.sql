-- Add Extended Features to Existing Schema
-- This adds advanced reviews, images, FAQ, notifications, and admin features

-- Add missing columns to existing tables
ALTER TABLE caterers 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Enhanced reviews table (replace existing basic reviews)
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
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
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  
  -- Response from caterer
  caterer_response TEXT,
  caterer_response_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_match', 'quote_request', 'message', 'booking_confirmed')),
  email_provider_id TEXT, -- Resend email ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create review images table
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create review votes table
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, voter_id)
);

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id UUID NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),
  is_helpful BOOLEAN NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faq_id, voter_id),
  UNIQUE(faq_id, ip_address) -- Prevent duplicate votes from same IP if not logged in
);

-- Create caterer images table
CREATE TABLE IF NOT EXISTS caterer_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_match ON email_notifications(match_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_reviews_caterer ON reviews(caterer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faq_votes_faq ON faq_votes(faq_id);
CREATE INDEX IF NOT EXISTS idx_caterer_images_caterer ON caterer_images(caterer_id);
CREATE INDEX IF NOT EXISTS idx_caterer_images_type ON caterer_images(image_type);
CREATE INDEX IF NOT EXISTS idx_caterer_images_primary ON caterer_images(caterer_id, is_primary) WHERE is_primary = TRUE;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_email_notifications_updated_at ON email_notifications;
CREATE TRIGGER update_email_notifications_updated_at 
BEFORE UPDATE ON email_notifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at 
BEFORE UPDATE ON reviews 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at 
BEFORE UPDATE ON faqs 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_caterer_images_updated_at ON caterer_images;
CREATE TRIGGER update_caterer_images_updated_at 
BEFORE UPDATE ON caterer_images 
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

-- Function to queue email notification for new matches
CREATE OR REPLACE FUNCTION queue_new_match_email()
RETURNS TRIGGER AS $$
DECLARE
  caterer_email TEXT;
BEGIN
  -- Get caterer email from profiles via caterers table
  SELECT p.email INTO caterer_email
  FROM caterers c
  JOIN profiles p ON c.profile_id = p.id
  WHERE c.id = NEW.caterer_id;
  
  -- Queue the email notification
  INSERT INTO email_notifications (
    match_id,
    recipient_email,
    notification_type,
    status,
    metadata
  ) VALUES (
    NEW.id,
    caterer_email,
    'new_match',
    'pending',
    jsonb_build_object(
      'match_id', NEW.id,
      'caterer_id', NEW.caterer_id,
      'request_id', NEW.request_id,
      'score', NEW.overall_score
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically queue email when match is created
DROP TRIGGER IF EXISTS queue_match_email_on_insert ON matches;
CREATE TRIGGER queue_match_email_on_insert
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION queue_new_match_email();

-- Insert sample FAQ data
INSERT INTO faqs (question, answer, category, tags, is_featured) VALUES
('How do I book a caterer?', 'Browse our verified caterers, request quotes, and book directly through our platform. Simply create an account, search for caterers in your area, and send booking requests.', 'Booking', ARRAY['booking', 'how-to', 'getting-started'], true),
('What types of events do you cater?', 'Our caterers handle all types of events including weddings, corporate events, birthday parties, conferences, private dinners, and more.', 'Services', ARRAY['events', 'services', 'types'], true),
('How far in advance should I book?', 'We recommend booking at least 2-4 weeks in advance for small events and 2-3 months for large events like weddings to ensure availability.', 'Booking', ARRAY['booking', 'timing', 'advance'], false),
('What is included in the catering service?', 'Services vary by caterer but typically include food preparation, delivery, setup, serving, and cleanup. Check individual caterer profiles for specific inclusions.', 'Services', ARRAY['services', 'inclusions', 'what-included'], false),
('How do payments work?', 'Most caterers require a deposit to secure your booking, with the balance due before or on the event day. Payment methods vary by caterer.', 'Payment', ARRAY['payment', 'deposit', 'billing'], false)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Extended features added successfully!';