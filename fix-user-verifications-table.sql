-- Script para arreglar la tabla user_verifications existente
-- Agregar columnas faltantes si no existen

-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_verifications') THEN
        -- Crear la tabla completa si no existe
        CREATE TABLE public.user_verifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            didit_session_id TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            document_number TEXT,
            date_of_birth DATE,
            date_of_issue DATE,
            gender TEXT,
            issuing_state TEXT,
            document_type TEXT,
            raw_didit_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla user_verifications creada exitosamente';
    ELSE
        RAISE NOTICE 'La tabla user_verifications ya existe';
    END IF;
END $$;

-- Agregar columnas faltantes si la tabla existe
DO $$
BEGIN
    -- Agregar didit_session_id si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'didit_session_id') THEN
        ALTER TABLE public.user_verifications ADD COLUMN didit_session_id TEXT UNIQUE;
        RAISE NOTICE 'Columna didit_session_id agregada';
    END IF;
    
    -- Agregar user_id si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_verifications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Columna user_id agregada';
    END IF;
    
    -- Agregar status si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'status') THEN
        ALTER TABLE public.user_verifications ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
        RAISE NOTICE 'Columna status agregada';
    END IF;
    
    -- Agregar first_name si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'first_name') THEN
        ALTER TABLE public.user_verifications ADD COLUMN first_name TEXT;
        RAISE NOTICE 'Columna first_name agregada';
    END IF;
    
    -- Agregar last_name si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'last_name') THEN
        ALTER TABLE public.user_verifications ADD COLUMN last_name TEXT;
        RAISE NOTICE 'Columna last_name agregada';
    END IF;
    
    -- Agregar document_number si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'document_number') THEN
        ALTER TABLE public.user_verifications ADD COLUMN document_number TEXT;
        RAISE NOTICE 'Columna document_number agregada';
    END IF;
    
    -- Agregar date_of_birth si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.user_verifications ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Columna date_of_birth agregada';
    END IF;
    
    -- Agregar date_of_issue si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'date_of_issue') THEN
        ALTER TABLE public.user_verifications ADD COLUMN date_of_issue DATE;
        RAISE NOTICE 'Columna date_of_issue agregada';
    END IF;
    
    -- Agregar gender si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'gender') THEN
        ALTER TABLE public.user_verifications ADD COLUMN gender TEXT;
        RAISE NOTICE 'Columna gender agregada';
    END IF;
    
    -- Agregar issuing_state si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'issuing_state') THEN
        ALTER TABLE public.user_verifications ADD COLUMN issuing_state TEXT;
        RAISE NOTICE 'Columna issuing_state agregada';
    END IF;
    
    -- Agregar document_type si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'document_type') THEN
        ALTER TABLE public.user_verifications ADD COLUMN document_type TEXT;
        RAISE NOTICE 'Columna document_type agregada';
    END IF;
    
    -- Agregar raw_didit_data si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'raw_didit_data') THEN
        ALTER TABLE public.user_verifications ADD COLUMN raw_didit_data JSONB;
        RAISE NOTICE 'Columna raw_didit_data agregada';
    END IF;
    
    -- Agregar updated_at si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_verifications' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_verifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada';
    END IF;
    
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_didit_session_id ON public.user_verifications (didit_session_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications (status);

-- Habilitar RLS si no está habilitado
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS si no existen
DO $$
BEGIN
    -- Política para SELECT
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_verifications' AND policyname = 'Users can view own verifications') THEN
        CREATE POLICY "Users can view own verifications" ON public.user_verifications
          FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Política SELECT creada';
    END IF;
    
    -- Política para INSERT
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_verifications' AND policyname = 'Allow webhook insertions') THEN
        CREATE POLICY "Allow webhook insertions" ON public.user_verifications
          FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política INSERT creada';
    END IF;
    
    -- Política para UPDATE
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_verifications' AND policyname = 'Allow webhook updates') THEN
        CREATE POLICY "Allow webhook updates" ON public.user_verifications
          FOR UPDATE USING (true);
        RAISE NOTICE 'Política UPDATE creada';
    END IF;
END $$;

-- Crear función y trigger para updated_at si no existen
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_verifications_updated_at') THEN
        CREATE TRIGGER update_user_verifications_updated_at 
          BEFORE UPDATE ON public.user_verifications 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger updated_at creado';
    END IF;
END $$;

-- Agregar comentarios
COMMENT ON TABLE public.user_verifications IS 'Almacena los resultados de verificación de identidad de Didit';
COMMENT ON COLUMN public.user_verifications.gender IS 'Género extraído del documento: F (Femenino), M (Masculino)';
COMMENT ON COLUMN public.user_verifications.status IS 'Estado de la verificación: approved, rejected, pending, not_started';
COMMENT ON COLUMN public.user_verifications.raw_didit_data IS 'Payload completo del webhook de Didit para depuración';

-- Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_verifications'
ORDER BY ordinal_position; 