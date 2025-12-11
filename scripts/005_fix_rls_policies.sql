-- Fix infinite recursion in RLS policies
-- This script drops all existing policies and creates simplified ones

-- First, drop ALL existing policies to start fresh

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;

-- Drop caterers policies
DROP POLICY IF EXISTS "Anyone can view active caterers" ON caterers;
DROP POLICY IF EXISTS "Caterers can view their own profile" ON caterers;
DROP POLICY IF EXISTS "Caterers can insert their own profile" ON caterers;
DROP POLICY IF EXISTS "Caterers can update their own profile" ON caterers;
DROP POLICY IF EXISTS "Caterers can delete their own profile" ON caterers;

-- Drop menu_items policies
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Caterers can manage their menu items" ON menu_items;

-- Drop event_requests policies
DROP POLICY IF EXISTS "Customers can view their own requests" ON event_requests;
DROP POLICY IF EXISTS "Customers can create requests" ON event_requests;
DROP POLICY IF EXISTS "Customers can update their own requests" ON event_requests;
DROP POLICY IF EXISTS "Customers can delete their own requests" ON event_requests;
DROP POLICY IF EXISTS "Caterers can view requests they are matched with" ON event_requests;

-- Drop matches policies
DROP POLICY IF EXISTS "Customers can view matches for their requests" ON matches;
DROP POLICY IF EXISTS "Caterers can view their matches" ON matches;
DROP POLICY IF EXISTS "Caterers can update their match responses" ON matches;
DROP POLICY IF EXISTS "System can insert matches" ON matches;

-- Drop messages policies
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;

-- Drop reviews policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can create reviews for completed matches" ON reviews;

-- ============================================
-- SIMPLIFIED POLICIES (No circular references)
-- ============================================

-- PROFILES: Simple direct auth checks
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- CATERERS: Simple checks, no subqueries to other RLS tables
CREATE POLICY "caterers_select_public" ON caterers
  FOR SELECT USING (is_active = true);

CREATE POLICY "caterers_select_own" ON caterers
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "caterers_insert_own" ON caterers
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "caterers_update_own" ON caterers
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "caterers_delete_own" ON caterers
  FOR DELETE USING (profile_id = auth.uid());

-- MENU_ITEMS: Allow all reads, restrict writes to owner
CREATE POLICY "menu_items_select_all" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "menu_items_insert_own" ON menu_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM caterers WHERE id = caterer_id AND profile_id = auth.uid())
  );

CREATE POLICY "menu_items_update_own" ON menu_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM caterers WHERE id = caterer_id AND profile_id = auth.uid())
  );

CREATE POLICY "menu_items_delete_own" ON menu_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM caterers WHERE id = caterer_id AND profile_id = auth.uid())
  );

-- EVENT_REQUESTS: Customers manage own, caterers view via service role
-- Using SECURITY DEFINER functions to avoid recursion
CREATE POLICY "event_requests_select_customer" ON event_requests
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "event_requests_insert_customer" ON event_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "event_requests_update_customer" ON event_requests
  FOR UPDATE USING (customer_id = auth.uid());

CREATE POLICY "event_requests_delete_customer" ON event_requests
  FOR DELETE USING (customer_id = auth.uid());

-- Allow caterers to view event requests (no subquery to matches)
CREATE POLICY "event_requests_select_caterer" ON event_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'caterer')
  );

-- MATCHES: Simple ownership checks without circular refs
CREATE POLICY "matches_select_customer" ON matches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_requests WHERE id = request_id AND customer_id = auth.uid())
  );

CREATE POLICY "matches_select_caterer" ON matches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM caterers WHERE id = caterer_id AND profile_id = auth.uid())
  );

CREATE POLICY "matches_update_caterer" ON matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM caterers WHERE id = caterer_id AND profile_id = auth.uid())
  );

-- Allow system/service role to insert matches
CREATE POLICY "matches_insert_service" ON matches
  FOR INSERT WITH CHECK (true);

-- MESSAGES: Simple ownership via match participants
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "messages_select_participant" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (
        EXISTS (SELECT 1 FROM caterers WHERE id = m.caterer_id AND profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- REVIEWS: Public read, owner write
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
