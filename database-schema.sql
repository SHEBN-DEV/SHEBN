-- Estructura de base de datos para SHEBN con validación de género y KYC

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    user_name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'rejected_gender')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de verificaciones de usuario
CREATE TABLE IF NOT EXISTS user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'rejected_gender')),
    verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON user_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para user_verifications
CREATE POLICY "Users can view own verifications" ON user_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert verifications" ON user_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update verifications" ON user_verifications
    FOR UPDATE USING (true);

-- Función para validar que solo mujeres puedan registrarse
CREATE OR REPLACE FUNCTION validate_female_only()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gender != 'female' THEN
        RAISE EXCEPTION 'Solo se permiten registros de género femenino';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar género en inserción
CREATE TRIGGER validate_female_only_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_female_only();

-- Comentarios para documentación
COMMENT ON TABLE profiles IS 'Perfiles de usuario con validación de género femenino';
COMMENT ON COLUMN profiles.gender IS 'Género del usuario - solo se permiten mujeres';
COMMENT ON COLUMN profiles.verification_status IS 'Estado de verificación KYC de Didit';
COMMENT ON TABLE user_verifications IS 'Historial de verificaciones de identidad'; 