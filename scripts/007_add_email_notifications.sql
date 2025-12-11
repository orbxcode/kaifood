-- Add email notification triggers for new matches
-- This script sets up automatic email notifications when caterers get matched

-- Create a table to track email notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create indexes for email notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_match ON email_notifications(match_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(notification_type);

-- Add trigger for email notifications table
DROP TRIGGER IF EXISTS update_email_notifications_updated_at ON email_notifications;
CREATE TRIGGER update_email_notifications_updated_at 
BEFORE UPDATE ON email_notifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to queue email notification for new matches
CREATE OR REPLACE FUNCTION queue_new_match_email()
RETURNS TRIGGER AS $$
DECLARE
  caterer_email TEXT;
BEGIN
  -- Get caterer email
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
      'overall_score', NEW.overall_score
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

-- Function to process pending email notifications (to be called by a cron job or webhook)
CREATE OR REPLACE FUNCTION process_pending_email_notifications()
RETURNS TABLE(
  notification_id UUID,
  match_id UUID,
  recipient_email TEXT,
  notification_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    en.id,
    en.match_id,
    en.recipient_email,
    en.notification_type
  FROM email_notifications en
  WHERE en.status = 'pending'
    AND en.retry_count < 3
  ORDER BY en.created_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email notification as sent
CREATE OR REPLACE FUNCTION mark_email_notification_sent(
  notification_id UUID,
  provider_email_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_notifications
  SET 
    status = 'sent',
    sent_at = NOW(),
    email_provider_id = provider_email_id,
    updated_at = NOW()
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark email notification as failed
CREATE OR REPLACE FUNCTION mark_email_notification_failed(
  notification_id UUID,
  error_msg TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_notifications
  SET 
    status = 'failed',
    error_message = error_msg,
    retry_count = retry_count + 1,
    updated_at = NOW()
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a view for email notification analytics
CREATE OR REPLACE VIEW email_notification_stats AS
SELECT 
  notification_type,
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))/60) as avg_delivery_time_minutes
FROM email_notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY notification_type, status
ORDER BY notification_type, status;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON email_notifications TO authenticated;
-- GRANT EXECUTE ON FUNCTION process_pending_email_notifications() TO authenticated;
-- GRANT EXECUTE ON FUNCTION mark_email_notification_sent(UUID, TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION mark_email_notification_failed(UUID, TEXT) TO authenticated;