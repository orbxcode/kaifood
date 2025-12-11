-- Kai Catering Platform Database Schema
-- This script creates all necessary tables for the catering marketplace

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'caterer')),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caterers table (business profiles for caterers)
CREATE TABLE IF NOT EXISTS caterers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  cuisine_types TEXT[] DEFAULT '{}',
  dietary_capabilities TEXT[] DEFAULT '{}',
  service_styles TEXT[] DEFAULT '{}',
  event_types TEXT[] DEFAULT '{}',
  min_guests INTEGER DEFAULT 10,
  max_guests INTEGER DEFAULT 500,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'South Africa',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  service_radius_km INTEGER DEFAULT 50,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  profile_completeness INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  extracted_attributes JSONB DEFAULT '{}',
  embedding_id TEXT,
  last_extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Menu items for caterers
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES caterers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_per_person DECIMAL(10,2),
  dietary_tags TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event requests from customers
CREATE TABLE IF NOT EXISTS event_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_name TEXT,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  guest_count INTEGER NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  food_category TEXT,
  cuisine_preferences TEXT[] DEFAULT '{}',
  dietary_requirements TEXT[] DEFAULT '{}',
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  service_style TEXT,
  additional_notes TEXT,
  extracted_attributes JSONB DEFAULT '{}',
  embedding_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matching', 'matched', 'booked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches between requests and caterers
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES event_requests(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES caterers(id) ON DELETE CASCADE,
  semantic_score DECIMAL(5,4) DEFAULT 0,
  distance_km DECIMAL(10,2),
  distance_score DECIMAL(5,4) DEFAULT 0,
  compatibility_score DECIMAL(5,4) DEFAULT 0,
  overall_score DECIMAL(5,4) DEFAULT 0,
  rank INTEGER,
  match_reasons JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'contacted', 'quoted', 'accepted', 'declined')),
  caterer_response TEXT,
  quoted_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, caterer_id)
);

-- Messages between customers and caterers
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews for caterers
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES caterers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_caterers_location ON caterers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_caterers_profile ON caterers(profile_id);
CREATE INDEX IF NOT EXISTS idx_caterers_active ON caterers(is_active);
CREATE INDEX IF NOT EXISTS idx_event_requests_customer ON event_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_date ON event_requests(event_date);
CREATE INDEX IF NOT EXISTS idx_matches_request ON matches(request_id);
CREATE INDEX IF NOT EXISTS idx_matches_caterer ON matches(caterer_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_reviews_caterer ON reviews(caterer_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_caterers_updated_at ON caterers;
CREATE TRIGGER update_caterers_updated_at BEFORE UPDATE ON caterers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_requests_updated_at ON event_requests;
CREATE TRIGGER update_event_requests_updated_at BEFORE UPDATE ON event_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
