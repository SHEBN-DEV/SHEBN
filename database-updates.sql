-- ========================================
-- ACTUALIZACIONES DE BASE DE DATOS PARA DIDIT
-- ========================================
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas de verificación a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT,
ADD COLUMN IF NOT EXISTS verification_data JSONB,
ADD COLUMN IF NOT EXISTS didit_session_id TEXT,
ADD COLUMN IF NOT EXISTS didit_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- 2. Crear tabla de logs para webhooks (opcional)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  session_id TEXT,
  user_id TEXT,
  status TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_result JSONB,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_didit_session_id ON profiles(didit_session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_session_id ON webhook_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Políticas RLS para webhook_logs (solo lectura para usuarios autenticados)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook logs" ON webhook_logs
    FOR SELECT USING (
        auth.uid()::text = user_id
    );

-- 7. Función para limpiar logs antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM webhook_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Comentarios para documentación
COMMENT ON COLUMN profiles.verification_status IS 'Estado de verificación de Didit: pending, approved, declined, failed';
COMMENT ON COLUMN profiles.verification_data IS 'Datos completos de verificación de Didit';
COMMENT ON COLUMN profiles.didit_session_id IS 'ID de sesión de Didit para tracking';
COMMENT ON COLUMN profiles.didit_verified IS 'Indica si el usuario está verificado por Didit';
COMMENT ON TABLE webhook_logs IS 'Logs de webhooks de Didit para auditoría';

-- ========================================
-- VERIFICACIÓN DE CAMBIOS
-- ========================================

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('verification_status', 'verification_data', 'didit_session_id', 'didit_verified', 'updated_at');

-- Verificar que la tabla de logs se creó
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'webhook_logs'
);

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Las columnas se agregan de forma segura con IF NOT EXISTS
-- 3. Los índices mejoran el rendimiento de consultas
-- 4. La tabla webhook_logs es opcional pero recomendada para auditoría
-- 5. Las políticas RLS protegen los datos de los usuarios
-- 6. La función de limpieza se puede ejecutar manualmente o con un cron job 