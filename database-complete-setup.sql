-- =====================================================
-- COMPLETE SHEBN DATABASE CONFIGURATION
-- Updated to follow official Didit demo pattern
-- =====================================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create user profiles table (following official pattern)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    user_name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'approved')),
    is_verified BOOLEAN DEFAULT FALSE, -- Following official pattern
    date_of_birth DATE, -- Following official pattern
    document_expires_at DATE, -- Following official pattern
    bio TEXT,
    location TEXT,
    portfolio_url TEXT,
    avatar_url TEXT,
    didit_verified BOOLEAN DEFAULT FALSE,
    didit_session_id TEXT,
    didit_verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create verification sessions table (following official pattern)
CREATE TABLE IF NOT EXISTS public.verification_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL, -- Didit session ID
    status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'APPROVED', 'DECLINED', 'IN_REVIEW', 'EXPIRED', 'ABANDONED', 'KYC_EXPIRED')),
    verification_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user verifications table (for detailed verification data)
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_provider TEXT NOT NULL DEFAULT 'didit',
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'failed')),
    provider_verification_id TEXT UNIQUE,
    session_id TEXT UNIQUE,
    verification_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_members JSONB,
    requirements TEXT,
    budget_range TEXT,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create project applications table
CREATE TABLE IF NOT EXISTS public.project_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    cover_letter TEXT,
    portfolio_links JSONB,
    experience_level TEXT,
    proposed_budget NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create user connections table
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);

-- 8. Create webhook logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    webhook_data JSONB DEFAULT '{}',
    status TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        user_name,
        email,
        gender,
        verification_status,
        is_verified
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'user_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'gender', 'other'),
        'pending',
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for new users
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_sessions_updated_at BEFORE UPDATE ON public.verification_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_applications_updated_at BEFORE UPDATE ON public.project_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON public.profiles(user_name);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_didit_verified ON public.profiles(didit_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_didit_session_id ON public.profiles(didit_session_id);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_id ON public.verification_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_session_id ON public.verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON public.verification_sessions(status);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_provider ON public.user_verifications(verification_provider);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_session_id ON public.user_verifications(session_id);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant_id ON public.project_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications(status);

CREATE INDEX IF NOT EXISTS idx_user_connections_requester_id ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_receiver_id ON public.user_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON public.user_connections(status);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_session_id ON public.webhook_logs(session_id);

-- 14. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 15. Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage all profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- Verification sessions policies
CREATE POLICY "Users can view own verification sessions" ON public.verification_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all verification sessions" ON public.verification_sessions FOR ALL USING (auth.role() = 'service_role');

-- User verifications policies
CREATE POLICY "Users can view own verifications" ON public.user_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all verifications" ON public.user_verifications FOR ALL USING (auth.role() = 'service_role');

-- Projects policies
CREATE POLICY "Users can view all projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- Project applications policies
CREATE POLICY "Users can view project applications" ON public.project_applications FOR SELECT USING (true);
CREATE POLICY "Users can create applications" ON public.project_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Users can update own applications" ON public.project_applications FOR UPDATE USING (auth.uid() = applicant_id);

-- User connections policies
CREATE POLICY "Users can view own connections" ON public.user_connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create connections" ON public.user_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own connections" ON public.user_connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Webhook logs policies
CREATE POLICY "Service role can manage all webhook logs" ON public.webhook_logs FOR ALL USING (auth.role() = 'service_role');

-- 16. Grant permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.verification_sessions TO authenticated;
GRANT SELECT ON public.user_verifications TO authenticated;
GRANT SELECT ON public.projects TO authenticated;
GRANT INSERT, UPDATE ON public.projects TO authenticated;
GRANT SELECT ON public.project_applications TO authenticated;
GRANT INSERT, UPDATE ON public.project_applications TO authenticated;
GRANT SELECT ON public.user_connections TO authenticated;
GRANT INSERT, UPDATE ON public.user_connections TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.verification_sessions TO service_role;
GRANT ALL ON public.user_verifications TO service_role;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.project_applications TO service_role;
GRANT ALL ON public.user_connections TO service_role;
GRANT ALL ON public.webhook_logs TO service_role; 