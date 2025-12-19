-- Migration: white-labeled dashboard v2
-- Description: Adds multi-tenancy support, webhooks, and advanced analytics tables.

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Clients Table (Tenants)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  branding JSONB DEFAULT '{"primaryColor": "#3b82f6", "logoUrl": null}'::jsonb,
  api_key TEXT UNIQUE, -- Dashboard API Key for white-label access
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Modify Profiles to link to Clients
-- We check if the column exists first to avoid errors during re-migration
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'client_id') THEN
        ALTER TABLE profiles ADD COLUMN client_id UUID REFERENCES clients(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'Owner' CHECK (role IN ('Owner', 'Admin', 'Client', 'Developer'));
    END IF;
END $$;

-- 4. Create Agents Table (Cached from Vapi)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  vapi_id TEXT NOT NULL,
  name TEXT DEFAULT 'Unnamed Agent',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, vapi_id)
);

-- 5. Create Calls Table (Rich data for analytics)
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  vapi_call_id TEXT NOT NULL UNIQUE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT, -- started, completed, failed
  duration INTEGER DEFAULT 0, -- In seconds
  cost NUMERIC(10, 4) DEFAULT 0,
  transcript TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Webhook Events (Idempotency and logging)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vapi_event_id TEXT UNIQUE,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Aggregated Metrics (For dashboard speed)
CREATE TABLE IF NOT EXISTS aggregated_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimension TEXT, -- e.g., 'daily', 'agent_id'
  dimension_value TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RLS Support for Multi-tenancy
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
-- Clients: Only accessible if you belong to it
CREATE POLICY "Users can view their own client" 
  ON clients FOR SELECT 
  USING (id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));

-- Agents/Calls: Filtered by client_id
CREATE POLICY "Users can manage agents in their client" 
  ON agents FOR ALL 
  USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage calls in their client" 
  ON calls FOR ALL 
  USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view metrics in their client" 
  ON aggregated_metrics FOR SELECT 
  USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));

-- 9. Helper Function to set client_id for new users
-- This would be used during onboarding or a trigger.
