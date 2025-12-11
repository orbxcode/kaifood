-- Add subscription tiers for caterers
-- Tiers: basic (R249), pro (R499), business (R999)
-- Job routing based on total budget:
--   < R20,000 → Basic
--   R20,000 - R50,000 → Pro
--   > R50,000 → Business

-- Add subscription fields to caterers table
ALTER TABLE caterers 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'business')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS jobs_received_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_job_assigned_at TIMESTAMPTZ;

-- Add total budget fields to event_requests for easier routing
ALTER TABLE event_requests
ADD COLUMN IF NOT EXISTS budget_per_person DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS budget_type TEXT DEFAULT 'per_person' CHECK (budget_type IN ('per_person', 'total')),
ADD COLUMN IF NOT EXISTS normalized_city TEXT,
ADD COLUMN IF NOT EXISTS normalized_location JSONB DEFAULT '{}';

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'business')),
  price_cents INTEGER NOT NULL,
  price_display TEXT NOT NULL,
  paystack_plan_code TEXT,
  max_budget_limit DECIMAL(10,2),
  min_budget_limit DECIMAL(10,2) DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO subscription_plans (name, tier, price_cents, price_display, max_budget_limit, min_budget_limit, features) VALUES
('Basic', 'basic', 24900, 'R249/month', 20000, 0, '["Up to R20k events", "5 leads per month", "Basic analytics", "Email support"]'),
('Pro', 'pro', 49900, 'R499/month', 50000, 20000, '["R20k-R50k events", "15 leads per month", "Advanced analytics", "Priority support", "Featured listing"]'),
('Business', 'business', 99900, 'R999/month', NULL, 50000, '["R50k+ premium events", "Unlimited leads", "Full analytics suite", "Dedicated support", "Top placement", "Custom branding"]')
ON CONFLICT (name) DO NOTHING;

-- Create subscription transactions log
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES caterers(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  paystack_reference TEXT,
  paystack_transaction_id TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  event_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Round-robin tracking table
CREATE TABLE IF NOT EXISTS round_robin_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL,
  city TEXT NOT NULL,
  last_assigned_caterer_id UUID REFERENCES caterers(id),
  assignment_index INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier, city)
);

-- Index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_caterers_subscription ON caterers(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_caterers_last_job ON caterers(last_job_assigned_at);
CREATE INDEX IF NOT EXISTS idx_event_requests_total_budget ON event_requests(total_budget);
CREATE INDEX IF NOT EXISTS idx_round_robin_tier_city ON round_robin_state(tier, city);
