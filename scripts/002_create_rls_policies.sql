-- Row Level Security Policies for Kai Platform

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caterers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Caterers policies
CREATE POLICY "Anyone can view active caterers" ON caterers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Caterers can view their own profile" ON caterers
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Caterers can insert their own profile" ON caterers
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Caterers can update their own profile" ON caterers
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Caterers can delete their own profile" ON caterers
  FOR DELETE USING (profile_id = auth.uid());

-- Menu items policies
CREATE POLICY "Anyone can view menu items" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Caterers can manage their menu items" ON menu_items
  FOR ALL USING (
    caterer_id IN (SELECT id FROM caterers WHERE profile_id = auth.uid())
  );

-- Event requests policies
CREATE POLICY "Customers can view their own requests" ON event_requests
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can create requests" ON event_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own requests" ON event_requests
  FOR UPDATE USING (customer_id = auth.uid());

CREATE POLICY "Customers can delete their own requests" ON event_requests
  FOR DELETE USING (customer_id = auth.uid());

CREATE POLICY "Caterers can view requests they are matched with" ON event_requests
  FOR SELECT USING (
    id IN (
      SELECT request_id FROM matches 
      WHERE caterer_id IN (SELECT id FROM caterers WHERE profile_id = auth.uid())
    )
  );

-- Matches policies
CREATE POLICY "Customers can view matches for their requests" ON matches
  FOR SELECT USING (
    request_id IN (SELECT id FROM event_requests WHERE customer_id = auth.uid())
  );

CREATE POLICY "Caterers can view their matches" ON matches
  FOR SELECT USING (
    caterer_id IN (SELECT id FROM caterers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Caterers can update their match responses" ON matches
  FOR UPDATE USING (
    caterer_id IN (SELECT id FROM caterers WHERE profile_id = auth.uid())
  );

CREATE POLICY "System can insert matches" ON matches
  FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    match_id IN (
      SELECT m.id FROM matches m
      JOIN event_requests er ON m.request_id = er.id
      JOIN caterers c ON m.caterer_id = c.id
      WHERE er.customer_id = auth.uid() OR c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN event_requests er ON m.request_id = er.id
      JOIN caterers c ON m.caterer_id = c.id
      WHERE er.customer_id = auth.uid() OR c.profile_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews for completed matches" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    match_id IN (
      SELECT m.id FROM matches m
      JOIN event_requests er ON m.request_id = er.id
      WHERE er.customer_id = auth.uid() AND m.status = 'accepted'
    )
  );
