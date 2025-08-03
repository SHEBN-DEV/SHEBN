-- =====================================================
-- VERIFICACIÓN DE BASE DE DATOS SHEBN
-- Script para verificar que todo se creó correctamente
-- =====================================================

-- 1. Verificar que todas las tablas existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ No existe'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_verifications', 'projects', 'project_applications', 'user_connections', 'webhook_logs')
ORDER BY table_name;

-- 2. Verificar estructura de la tabla profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar que el trigger handle_new_user existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- 4. Verificar que la función handle_new_user existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 5. Verificar número de filas en cada tabla
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'user_verifications' as table_name, COUNT(*) as row_count FROM public.user_verifications
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as row_count FROM public.projects
UNION ALL
SELECT 'project_applications' as table_name, COUNT(*) as row_count FROM public.project_applications
UNION ALL
SELECT 'user_connections' as table_name, COUNT(*) as row_count FROM public.user_connections
UNION ALL
SELECT 'webhook_logs' as table_name, COUNT(*) as row_count FROM public.webhook_logs;

-- 6. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_verifications', 'projects', 'project_applications', 'user_connections', 'webhook_logs');

-- 7. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ¡Verificación completada! 🎉 