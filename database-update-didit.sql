-- =====================================================
-- ACTUALIZACIÓN DE BASE DE DATOS PARA DIDIT
-- Agregar columnas faltantes a la tabla profiles
-- =====================================================

-- 1. Agregar columnas de Didit a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS didit_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS didit_session_id TEXT,
ADD COLUMN IF NOT EXISTS verification_data JSONB;

-- 2. Actualizar el constraint de verification_status para incluir 'approved'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_verification_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_verification_status_check 
CHECK (verification_status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'approved'));

-- 3. Actualizar la función handle_new_user para incluir campos de Didit
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

-- 4. Crear tabla de logs de webhooks si no existe
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    webhook_data JSONB,
    status TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_profiles_didit_verified ON public.profiles(didit_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_didit_session_id ON public.profiles(didit_session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_session_id ON public.webhook_logs(session_id);

-- 6. Verificar que los cambios se aplicaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 