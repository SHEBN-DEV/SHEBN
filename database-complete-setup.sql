-- =====================================================
-- CONFIGURACIÓN COMPLETA DE BASE DE DATOS SHEBN
-- Script para crear toda la base de datos desde cero
-- =====================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    user_name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'approved')),
    bio TEXT,
    location TEXT,
    portfolio_url TEXT,
    avatar_url TEXT,
    didit_verified BOOLEAN DEFAULT FALSE,
    didit_session_id TEXT,
    verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de verificaciones de usuario
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    verification_provider TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'failed')),
    verification_data JSONB,
    provider_verification_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de proyectos
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

-- 5. Crear tabla de aplicaciones a proyectos
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

-- 6. Crear tabla de conexiones entre usuarios
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);

-- 7. Crear tabla de logs de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    webhook_data JSONB,
    status TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Crear función para manejar nuevos usuarios
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
        didit_verified,
        didit_session_id,
        verification_data,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'user_name', 'usuario_' || substr(NEW.id::text, 1, 8)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'gender', 'female'),
        COALESCE(NEW.raw_user_meta_data->>'verification_status', 'pending'),
        COALESCE((NEW.raw_user_meta_data->>'didit_verified')::boolean, false),
        NEW.raw_user_meta_data->>'didit_session_id',
        CASE
            WHEN NEW.raw_user_meta_data->>'didit_session_id' IS NOT NULL
            THEN jsonb_build_object(
                'session_id', NEW.raw_user_meta_data->>'didit_session_id',
                'status', COALESCE(NEW.raw_user_meta_data->>'verification_status', 'pending'),
                'created_at', NOW()
            )
            ELSE NULL
        END,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 9. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 10. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Crear triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_applications_updated_at BEFORE UPDATE ON public.project_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON public.profiles(user_name);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_didit_verified ON public.profiles(didit_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_didit_session_id ON public.profiles(didit_session_id);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_provider ON public.user_verifications(verification_provider);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);

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

-- 13. Configurar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 14. Crear políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 15. Crear políticas RLS para user_verifications
CREATE POLICY "Users can view their own verifications" ON public.user_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications" ON public.user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 16. Crear políticas RLS para projects
CREATE POLICY "Users can view all projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = owner_id);

-- 17. Crear políticas RLS para project_applications
CREATE POLICY "Users can view applications for projects they own" ON public.project_applications
    FOR SELECT USING (
        auth.uid() = applicant_id OR 
        auth.uid() IN (
            SELECT owner_id FROM public.projects WHERE id = project_id
        )
    );

CREATE POLICY "Users can create their own applications" ON public.project_applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own applications" ON public.project_applications
    FOR UPDATE USING (auth.uid() = applicant_id);

-- 18. Crear políticas RLS para user_connections
CREATE POLICY "Users can view their own connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connections" ON public.user_connections
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own connections" ON public.user_connections
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 19. Crear políticas RLS para webhook_logs (solo para webhooks)
CREATE POLICY "Webhook logs are readable by service role" ON public.webhook_logs
    FOR SELECT USING (true);

CREATE POLICY "Webhook logs can be inserted by service role" ON public.webhook_logs
    FOR INSERT WITH CHECK (true);

-- 20. Verificar que todo se creó correctamente
SELECT 'Profiles table' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'User verifications table' as table_name, COUNT(*) as row_count FROM public.user_verifications
UNION ALL
SELECT 'Projects table' as table_name, COUNT(*) as row_count FROM public.projects
UNION ALL
SELECT 'Project applications table' as table_name, COUNT(*) as row_count FROM public.project_applications
UNION ALL
SELECT 'User connections table' as table_name, COUNT(*) as row_count FROM public.user_connections
UNION ALL
SELECT 'Webhook logs table' as table_name, COUNT(*) as row_count FROM public.webhook_logs;

-- 21. Verificar que el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- 22. Verificar que la función existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- ¡Base de datos configurada completamente! 🎉 