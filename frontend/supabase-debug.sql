-- Debug script to check and fix Supabase table structure
-- Run this in your Supabase SQL Editor

-- First, let's see what tables exist
SELECT 
    table_name, 
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if our required tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN 'users table exists'
        ELSE 'users table missing'
    END as users_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public') THEN 'accounts table exists'
        ELSE 'accounts table missing'
    END as accounts_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') THEN 'sessions table exists'
        ELSE 'sessions table missing'
    END as sessions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_tokens' AND table_schema = 'public') THEN 'verification_tokens table exists'
        ELSE 'verification_tokens table missing'
    END as verification_tokens_status;

-- Check table permissions
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
ORDER BY table_name, privilege_type;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'accounts', 'sessions', 'verification_tokens');

-- If tables exist but have issues, let's recreate them with exact NextAuth requirements
DO $$
BEGIN
    -- Drop existing tables if they have issues
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_tokens' AND table_schema = 'public') THEN
        DROP TABLE public.verification_tokens CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') THEN
        DROP TABLE public.sessions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public') THEN
        DROP TABLE public.accounts CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        DROP TABLE public.users CASCADE;
    END IF;
END $$;

-- Create tables with exact NextAuth.js requirements
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT
);

CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE public.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add foreign keys
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

-- Grant permissions to authenticated and anon users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.users TO authenticated, anon;
GRANT ALL ON public.accounts TO authenticated, anon;
GRANT ALL ON public.sessions TO authenticated, anon;
GRANT ALL ON public.verification_tokens TO authenticated, anon;

-- Disable RLS completely for now
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens DISABLE ROW LEVEL SECURITY;

-- Verify final structure
SELECT 
    'Final table structure:' as info,
    table_name, 
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
ORDER BY table_name; 