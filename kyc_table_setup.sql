-- Crear la tabla kyc_data en Supabase
-- Ejecuta este SQL en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS kyc_data (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    document_number VARCHAR(50) NOT NULL,
    dni_photo_url TEXT NOT NULL,
    face_id_url TEXT NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    x_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_kyc_data_status ON kyc_data(status);
CREATE INDEX IF NOT EXISTS idx_kyc_data_created_at ON kyc_data(created_at);

-- Crear función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_kyc_data_updated_at ON kyc_data;
CREATE TRIGGER update_kyc_data_updated_at
    BEFORE UPDATE ON kyc_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar RLS (Row Level Security) para que los usuarios solo puedan ver/editar sus propios datos
ALTER TABLE kyc_data ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan insertar sus propios datos
CREATE POLICY "Users can insert their own KYC data" ON kyc_data
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para que los usuarios puedan ver sus propios datos
CREATE POLICY "Users can view their own KYC data" ON kyc_data
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar sus propios datos
CREATE POLICY "Users can update their own KYC data" ON kyc_data
    FOR UPDATE USING (auth.uid() = id);

-- Política para administradores (opcional - ajusta según tus necesidades)
-- CREATE POLICY "Admins can view all KYC data" ON kyc_data
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM auth.users 
--             WHERE auth.users.id = auth.uid() 
--             AND auth.users.email IN ('admin@example.com')
--         )
--     ); 