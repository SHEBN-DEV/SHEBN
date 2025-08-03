-- =====================================================
-- DEBUG WEBHOOK - VERIFICAR SI HAY DATOS
-- =====================================================

-- 1. Verificar si webhook_logs tiene datos
SELECT 
    'webhook_logs' as tabla,
    COUNT(*) as total_registros
FROM webhook_logs;

-- 2. Si hay datos, mostrar el último webhook
SELECT 
    session_id,
    status,
    webhook_data,
    received_at
FROM webhook_logs
ORDER BY received_at DESC
LIMIT 3;

-- 3. Verificar la estructura de user_verifications
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_verifications'
ORDER BY ordinal_position;

-- 4. Verificar permisos de service_role
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_verifications'
AND grantee = 'service_role';

-- 5. Verificar si hay errores en la función
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%webhook%'
OR routine_name LIKE '%verification%';

-- ¡Debug completado! 🎉 