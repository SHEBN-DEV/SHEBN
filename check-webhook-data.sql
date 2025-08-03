-- =====================================================
-- VERIFICAR DATOS DEL WEBHOOK
-- Script para verificar si los datos se están guardando
-- =====================================================

-- 1. Verificar webhook_logs (debería tener datos)
SELECT 
    'webhook_logs' as tabla,
    COUNT(*) as total_registros,
    MAX(received_at) as ultimo_webhook
FROM webhook_logs;

-- 2. Verificar user_verifications (debería tener datos)
SELECT 
    'user_verifications' as tabla,
    COUNT(*) as total_registros,
    verification_provider,
    status,
    provider_verification_id,
    created_at
FROM user_verifications
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar profiles (probablemente vacío)
SELECT 
    'profiles' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN didit_verified = true THEN 1 END) as verificados,
    COUNT(CASE WHEN didit_session_id IS NOT NULL THEN 1 END) as con_session_id
FROM profiles;

-- 4. Verificar auth.users (probablemente vacío)
SELECT 
    'auth.users' as tabla,
    COUNT(*) as total_usuarios
FROM auth.users;

-- 5. Verificar el último webhook específico
SELECT 
    session_id,
    status,
    webhook_data,
    received_at
FROM webhook_logs
ORDER BY received_at DESC
LIMIT 1;

-- 6. Verificar la última verificación específica
SELECT 
    verification_provider,
    status,
    provider_verification_id,
    verification_data,
    created_at
FROM user_verifications
ORDER BY created_at DESC
LIMIT 1;

-- ¡Verificación completada! 🎉 