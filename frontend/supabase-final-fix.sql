-- Final fix for PGRST106 error - Create tables from scratch
-- Run this in your Supabase SQL Editor

-- Enable UUID extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
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
    UNIQUE(provider, provider_account_id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add foreign key constraints (only if tables exist)
DO $$
BEGIN
    -- Add foreign key for accounts table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_accounts_user_id' 
        AND table_name = 'accounts'
    ) THEN
        ALTER TABLE public.accounts 
        ADD CONSTRAINT fk_accounts_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for sessions table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_sessions_user_id' 
        AND table_name = 'sessions'
    ) THEN
        ALTER TABLE public.sessions 
        ADD CONSTRAINT fk_sessions_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON public.sessions(session_token);

-- Grant ALL permissions to public (temporary for testing)
GRANT ALL ON public.users TO public;
GRANT ALL ON public.accounts TO public;
GRANT ALL ON public.sessions TO public;
GRANT ALL ON public.verification_tokens TO public;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO public;

-- Disable RLS temporarily for testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens DISABLE ROW LEVEL SECURITY;

-- Verify tables were created
SELECT 
    table_name, 
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'accounts', 'sessions', 'verification_tokens')
ORDER BY table_name; 