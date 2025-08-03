-- =====================================================
-- SHEBN - Base de Datos Completa para Supabase
-- Plataforma exclusiva para mujeres con verificación KYC
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABLA DE PERFILES DE USUARIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    user_name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'approved')),
    didit_verified BOOLEAN DEFAULT FALSE,
    didit_session_id TEXT,
    verification_data JSONB,
    bio TEXT,
    location TEXT,
    portfolio_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA DE VERIFICACIONES DE USUARIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verification_provider TEXT DEFAULT 'didit' NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected', 'expired', 'error')),
    verification_data JSONB,
    provider_verification_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    team_members JSONB,
    requirements TEXT,
    budget_range TEXT,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE APLICACIONES A PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    cover_letter TEXT,
    portfolio_links JSONB,
    experience_level TEXT,
    proposed_budget DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, applicant_id)
);

-- =====================================================
-- 5. TABLA DE CONEXIONES/AMISTADES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);

-- =====================================================
-- 6. TABLA DE MENSAJES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TABLA DE NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('connection_request', 'project_application', 'message', 'verification_update', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TABLA DE CATEGORÍAS DE PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para perfiles
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON public.profiles(user_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Índices para verificaciones
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_provider ON public.user_verifications(verification_provider);

-- Índices para proyectos
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

-- Índices para aplicaciones
CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant_id ON public.project_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications(status);

-- Índices para conexiones
CREATE INDEX IF NOT EXISTS idx_user_connections_requester_id ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_receiver_id ON public.user_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON public.user_connections(status);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_applications_updated_at BEFORE UPDATE ON public.project_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para validar género en registro
CREATE OR REPLACE FUNCTION validate_gender_on_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo permitir registros de género femenino
    IF NEW.gender != 'female' THEN
        RAISE EXCEPTION 'Solo se permiten registros de género femenino';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validar género
CREATE TRIGGER validate_gender_trigger 
    BEFORE INSERT ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_gender_on_registration();

-- Función para crear perfil automáticamente
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
        verification_data
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
        END
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA PROFILES
-- =====================================================

-- Usuarios pueden ver todos los perfiles verificados
CREATE POLICY "Users can view verified profiles" ON public.profiles
    FOR SELECT USING (verification_status = 'completed');

-- Usuarios pueden editar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Usuarios pueden insertar su propio perfil (manejado por trigger)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLÍTICAS PARA VERIFICACIONES
-- =====================================================

-- Usuarios pueden ver sus propias verificaciones
CREATE POLICY "Users can view own verifications" ON public.user_verifications
    FOR SELECT USING (auth.uid() = user_id);

-- Usuarios pueden insertar sus propias verificaciones
CREATE POLICY "Users can insert own verifications" ON public.user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA PROYECTOS
-- =====================================================

-- Usuarios pueden ver proyectos de usuarios verificados
CREATE POLICY "Users can view projects from verified users" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = projects.owner_id 
            AND profiles.verification_status = 'completed'
        )
    );

-- Usuarios verificados pueden crear proyectos
CREATE POLICY "Verified users can create projects" ON public.projects
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.verification_status = 'completed'
        )
    );

-- Propietarios pueden editar sus proyectos
CREATE POLICY "Owners can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = owner_id);

-- Propietarios pueden eliminar sus proyectos
CREATE POLICY "Owners can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = owner_id);

-- =====================================================
-- POLÍTICAS PARA APLICACIONES
-- =====================================================

-- Usuarios pueden ver aplicaciones a sus proyectos
CREATE POLICY "Users can view applications to own projects" ON public.project_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_applications.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- Usuarios verificados pueden aplicar a proyectos
CREATE POLICY "Verified users can apply to projects" ON public.project_applications
    FOR INSERT WITH CHECK (
        auth.uid() = applicant_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.verification_status = 'completed'
        )
    );

-- Propietarios de proyectos pueden actualizar aplicaciones
CREATE POLICY "Project owners can update applications" ON public.project_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = project_applications.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA CONEXIONES
-- =====================================================

-- Usuarios pueden ver conexiones relacionadas
CREATE POLICY "Users can view related connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Usuarios verificados pueden crear conexiones
CREATE POLICY "Verified users can create connections" ON public.user_connections
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.verification_status = 'completed'
        )
    );

-- Usuarios pueden actualizar conexiones relacionadas
CREATE POLICY "Users can update related connections" ON public.user_connections
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- =====================================================
-- POLÍTICAS PARA MENSAJES
-- =====================================================

-- Usuarios pueden ver mensajes relacionados
CREATE POLICY "Users can view related messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Usuarios verificados pueden enviar mensajes
CREATE POLICY "Verified users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.verification_status = 'completed'
        )
    );

-- Usuarios pueden marcar mensajes como leídos
CREATE POLICY "Users can mark messages as read" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- =====================================================
-- POLÍTICAS PARA NOTIFICACIONES
-- =====================================================

-- Usuarios pueden ver sus notificaciones
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Usuarios pueden marcar notificaciones como leídas
CREATE POLICY "Users can mark notifications as read" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICAS PARA CATEGORÍAS
-- =====================================================

-- Todos pueden ver categorías
CREATE POLICY "Everyone can view categories" ON public.project_categories
    FOR SELECT USING (true);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar categorías de proyectos
INSERT INTO public.project_categories (name, description, icon, color) VALUES
('Desarrollo Web', 'Proyectos de desarrollo web y aplicaciones', '🌐', '#ff29d7'),
('Diseño UX/UI', 'Diseño de interfaces y experiencia de usuario', '🎨', '#ff6b35'),
('Marketing Digital', 'Estrategias de marketing y publicidad', '📈', '#4ecdc4'),
('Blockchain', 'Proyectos relacionados con blockchain y Web3', '⛓️', '#45b7d1'),
('Inteligencia Artificial', 'Proyectos de IA y machine learning', '🤖', '#96ceb4'),
('Consultoría', 'Servicios de consultoría y asesoramiento', '💼', '#feca57'),
('Educación', 'Proyectos educativos y de formación', '📚', '#ff9ff3'),
('Salud y Bienestar', 'Proyectos relacionados con salud', '🏥', '#54a0ff'),
('Sostenibilidad', 'Proyectos de impacto ambiental', '🌱', '#5f27cd'),
('Emprendimiento', 'Proyectos de emprendimiento y startups', '🚀', '#00d2d3')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de usuarios verificados
CREATE OR REPLACE VIEW public.verified_users AS
SELECT 
    p.id,
    p.full_name,
    p.user_name,
    p.email,
    p.gender,
    p.verification_status,
    p.bio,
    p.location,
    p.avatar_url,
    p.created_at
FROM public.profiles p
WHERE p.verification_status = 'completed';

-- Vista de proyectos activos
CREATE OR REPLACE VIEW public.active_projects AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.owner_id,
    p.team_members,
    p.requirements,
    p.budget_range,
    p.deadline,
    p.created_at,
    pr.full_name as owner_name,
    pr.user_name as owner_username
FROM public.projects p
JOIN public.profiles pr ON p.owner_id = pr.id
WHERE p.status = 'active' 
AND pr.verification_status = 'completed';

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener estadísticas de usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'projects_created', (SELECT COUNT(*) FROM public.projects WHERE owner_id = user_uuid),
        'projects_applied', (SELECT COUNT(*) FROM public.project_applications WHERE applicant_id = user_uuid),
        'connections_count', (
            SELECT COUNT(*) FROM public.user_connections 
            WHERE (requester_id = user_uuid OR receiver_id = user_uuid) 
            AND status = 'accepted'
        ),
        'verification_status', (SELECT verification_status FROM public.profiles WHERE id = user_uuid)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para buscar usuarios
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    user_name TEXT,
    bio TEXT,
    location TEXT,
    verification_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.user_name,
        p.bio,
        p.location,
        p.verification_status
    FROM public.profiles p
    WHERE p.verification_status = 'completed'
    AND (
        p.full_name ILIKE '%' || search_term || '%' OR
        p.user_name ILIKE '%' || search_term || '%' OR
        p.bio ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario con información personal y estado de verificación';
COMMENT ON TABLE public.user_verifications IS 'Registro de verificaciones de identidad de usuarios';
COMMENT ON TABLE public.projects IS 'Proyectos creados por usuarios verificados';
COMMENT ON TABLE public.project_applications IS 'Aplicaciones de usuarios a proyectos';
COMMENT ON TABLE public.user_connections IS 'Conexiones y amistades entre usuarios';
COMMENT ON TABLE public.messages IS 'Mensajes privados entre usuarios';
COMMENT ON TABLE public.notifications IS 'Notificaciones del sistema para usuarios';
COMMENT ON TABLE public.project_categories IS 'Categorías disponibles para proyectos';

COMMENT ON FUNCTION validate_gender_on_registration() IS 'Valida que solo se permitan registros de género femenino';
COMMENT ON FUNCTION handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un nuevo usuario';
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Obtiene estadísticas de un usuario específico';
COMMENT ON FUNCTION search_users(TEXT) IS 'Busca usuarios verificados por nombre, username o bio';

-- =====================================================
-- FIN DEL SCRIPT
-- ===================================================== 