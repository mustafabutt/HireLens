-- Fix for PGRST106 error - More robust table creation
-- Run this in your Supabase SQL Editor

-- First, drop existing tables if they exist (to ensure clean slate)
DROP TABLE IF EXISTS public.verification_tokens CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with explicit schema
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_tokens table
CREATE TABLE public.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints AFTER table creation
ALTER TABLE public.accounts 
ADD CONSTRAINT fk_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.sessions 
ADD CONSTRAINT fk_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX accounts_user_id_idx ON public.accounts(user_id);
CREATE INDEX sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX sessions_session_token_idx ON public.sessions(session_token);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.verification_tokens TO authenticated;

-- Grant permissions to anon users (for initial signup)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.accounts TO anon;
GRANT ALL ON public.sessions TO anon;
GRANT ALL ON public.verification_tokens TO anon;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on id" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.accounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on user_id" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for users based on user_id" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable all operations for verification tokens" ON public.verification_tokens FOR ALL USING (true);

-- Verify tables were created
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens'); 