-- Add RLS policies and Supabase Storage setup for extended features

-- Enable RLS on new tables
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE caterer_images ENABLE ROW LEVEL SECURITY;

-- Email notifications policies
CREATE POLICY "System can manage email notifications" ON email_notifications
FOR ALL USING (true);

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON reviews
FOR SELECT USING (status = 'approved');

CREATE POLICY "Customers can create reviews for completed matches" ON reviews
FOR INSERT WITH CHECK (
  reviewer_id = auth.uid() AND
  match_id IN (
    SELECT m.id FROM matches m
    JOIN event_requests er ON m.request_id = er.id
    WHERE er.customer_id = auth.uid() AND m.status = 'accepted'
  )
);

CREATE POLICY "Users can update their own reviews" ON reviews
FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" ON reviews
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Review images policies
CREATE POLICY "Anyone can view review images" ON review_images
FOR SELECT USING (true);

CREATE POLICY "Review owners can manage their images" ON review_images
FOR ALL USING (
  review_id IN (SELECT id FROM reviews WHERE reviewer_id = auth.uid())
);

-- Review votes policies
CREATE POLICY "Anyone can view review votes" ON review_votes
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON review_votes
FOR INSERT WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Users can update their own votes" ON review_votes
FOR UPDATE USING (voter_id = auth.uid());

-- FAQ policies
CREATE POLICY "Anyone can view published FAQs" ON faqs
FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage FAQs" ON faqs
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- FAQ votes policies
CREATE POLICY "Anyone can view FAQ votes" ON faq_votes
FOR SELECT USING (true);

CREATE POLICY "Users can vote on FAQs" ON faq_votes
FOR INSERT WITH CHECK (
  voter_id = auth.uid() OR voter_id IS NULL
);

CREATE POLICY "Users can update their own FAQ votes" ON faq_votes
FOR UPDATE USING (voter_id = auth.uid());

-- Caterer images policies
CREATE POLICY "Anyone can view caterer images" ON caterer_images
FOR SELECT USING (true);

CREATE POLICY "Caterers can manage their own images" ON caterer_images
FOR ALL USING (
  caterer_id IN (SELECT id FROM caterers WHERE profile_id = auth.uid())
);

CREATE POLICY "Admins can manage all caterer images" ON caterer_images
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Setup Supabase Storage for images
-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for images
-- Policy: Allow authenticated users to upload images to their own caterer folder
CREATE POLICY "Caterers can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'caterers'
  AND EXISTS (
    SELECT 1 FROM caterers c
    WHERE c.profile_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[2]
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
  AND EXISTS (
    SELECT 1 FROM caterers c
    WHERE c.profile_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[2]
  )
);

-- Policy: Allow caterers to delete their own images
CREATE POLICY "Caterers can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'caterers'
  AND EXISTS (
    SELECT 1 FROM caterers c
    WHERE c.profile_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[2]
  )
);

-- Grant necessary permissions
GRANT SELECT ON email_notifications TO authenticated;
GRANT ALL ON email_notifications TO authenticated;

GRANT SELECT ON reviews TO anon, authenticated;
GRANT ALL ON reviews TO authenticated;

GRANT SELECT ON review_images TO anon, authenticated;
GRANT ALL ON review_images TO authenticated;

GRANT SELECT ON review_votes TO anon, authenticated;
GRANT ALL ON review_votes TO authenticated;

GRANT SELECT ON faqs TO anon, authenticated;
GRANT ALL ON faqs TO authenticated;

GRANT SELECT ON faq_votes TO anon, authenticated;
GRANT ALL ON faq_votes TO authenticated;

GRANT SELECT ON caterer_images TO anon, authenticated;
GRANT ALL ON caterer_images TO authenticated;

RAISE NOTICE 'RLS policies and storage setup completed!';