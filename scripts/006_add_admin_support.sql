-- Add admin support and enhance message schema
-- This script adds admin functionality and improves messaging for the admin dashboard

-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- Update messages table to support admin dashboard functionality
-- Add message type for better categorization
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'quote', 'system', 'admin_note'));

-- Add priority level for admin dashboard
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add admin-specific fields
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_admin_message BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS requires_admin_attention BOOLEAN DEFAULT FALSE;

-- Add read timestamp for better tracking
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create admin messages table for internal admin communications
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for broadcast messages
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'internal' CHECK (message_type IN ('internal', 'broadcast', 'alert', 'notification')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation threads table for better message organization
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count_customer INTEGER DEFAULT 0,
  unread_count_caterer INTEGER DEFAULT 0,
  admin_notes TEXT,
  requires_admin_attention BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id)
);

-- Update messages table to reference conversation threads
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES conversation_threads(id) ON DELETE CASCADE;

-- Create indexes for admin dashboard performance
CREATE INDEX IF NOT EXISTS idx_messages_admin ON messages(is_admin_message);
CREATE INDEX IF NOT EXISTS idx_messages_attention ON messages(requires_admin_attention);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient ON admin_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_type ON admin_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_admin_messages_priority ON admin_messages(priority);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_attention ON conversation_threads(requires_admin_attention);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_status ON conversation_threads(status);

-- Add triggers for conversation threads
DROP TRIGGER IF EXISTS update_conversation_threads_updated_at ON conversation_threads;
CREATE TRIGGER update_conversation_threads_updated_at 
BEFORE UPDATE ON conversation_threads 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_messages_updated_at ON admin_messages;
CREATE TRIGGER update_admin_messages_updated_at 
BEFORE UPDATE ON admin_messages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation thread when new message is added
CREATE OR REPLACE FUNCTION update_conversation_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_message_at and unread counts
  UPDATE conversation_threads 
  SET 
    last_message_at = NEW.created_at,
    unread_count_customer = CASE 
      WHEN NEW.sender_id != customer_id THEN unread_count_customer + 1 
      ELSE unread_count_customer 
    END,
    unread_count_caterer = CASE 
      WHEN NEW.sender_id != caterer_id THEN unread_count_caterer + 1 
      ELSE unread_count_caterer 
    END,
    requires_admin_attention = CASE 
      WHEN NEW.requires_admin_attention THEN TRUE 
      ELSE requires_admin_attention 
    END
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message updates
DROP TRIGGER IF EXISTS update_thread_on_message ON messages;
CREATE TRIGGER update_thread_on_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.thread_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_thread_on_message();

-- Function to mark messages as read and update read timestamp
CREATE OR REPLACE FUNCTION mark_message_read(message_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE messages 
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE id = message_id AND (
    sender_id = user_id OR 
    EXISTS (
      SELECT 1 FROM conversation_threads ct 
      WHERE ct.id = messages.thread_id 
      AND (ct.customer_id = user_id OR ct.caterer_id = user_id)
    )
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to create conversation thread when match is created
CREATE OR REPLACE FUNCTION create_conversation_thread_on_match()
RETURNS TRIGGER AS $$
DECLARE
  customer_profile_id UUID;
BEGIN
  -- Get customer_id from event_request
  SELECT customer_id INTO customer_profile_id 
  FROM event_requests 
  WHERE id = NEW.request_id;
  
  -- Create conversation thread
  INSERT INTO conversation_threads (
    match_id,
    customer_id,
    caterer_id,
    subject
  ) VALUES (
    NEW.id,
    customer_profile_id,
    (SELECT profile_id FROM caterers WHERE id = NEW.caterer_id),
    'Event Discussion'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic thread creation
DROP TRIGGER IF EXISTS create_thread_on_match ON matches;
CREATE TRIGGER create_thread_on_match
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION create_conversation_thread_on_match();

-- Create the first admin user (you'll need to update the email)
-- This will be executed when you run the migration
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   uuid_generate_v4(),
--   'admin@kaicatering.com',
--   crypt('admin123', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- Note: The admin user creation above is commented out because it requires
-- direct access to auth.users table. Instead, create the user through Supabase Auth
-- and then update their profile with is_admin = TRUE using the following query:
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'your-admin-email@domain.com';