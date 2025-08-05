-- Tabla para almacenar los resultados de verificación de Didit
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  didit_session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- 'approved', 'rejected', 'pending', 'not_started'
  first_name TEXT,
  last_name TEXT,
  document_number TEXT,
  date_of_birth DATE,
  date_of_issue DATE,
  gender TEXT, -- 'F' (Femenino), 'M' (Masculino)
  issuing_state TEXT,
  document_type TEXT,
  raw_didit_data JSONB, -- Payload completo del webhook para depuración
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_didit_session_id ON public.user_verifications (didit_session_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications (status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuarios solo pueden ver sus propias verificaciones
CREATE POLICY "Users can view own verifications" ON public.user_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: Permitir inserción desde el webhook (backend)
CREATE POLICY "Allow webhook insertions" ON public.user_verifications
  FOR INSERT WITH CHECK (true);

-- Política RLS: Permitir actualizaciones desde el webhook (backend)
CREATE POLICY "Allow webhook updates" ON public.user_verifications
  FOR UPDATE USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_verifications_updated_at 
  BEFORE UPDATE ON public.user_verifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.user_verifications IS 'Almacena los resultados de verificación de identidad de Didit';
COMMENT ON COLUMN public.user_verifications.gender IS 'Género extraído del documento: F (Femenino), M (Masculino)';
COMMENT ON COLUMN public.user_verifications.status IS 'Estado de la verificación: approved, rejected, pending, not_started';
COMMENT ON COLUMN public.user_verifications.raw_didit_data IS 'Payload completo del webhook de Didit para depuración'; 