-- =====================================================
-- VERIFICACIÓN Y CONFIGURACIÓN DE PERMISOS
-- Para asegurar que el webhook pueda escribir en Supabase
-- =====================================================

-- 1. Verificar que el service_role existe
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname = 'service_role';

-- 2. Verificar permisos del service_role en la tabla profiles
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' 
AND grantee = 'service_role';

-- 3. Otorgar permisos completos al service_role en profiles
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Verificar permisos del service_role en webhook_logs
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'webhook_logs' 
AND grantee = 'service_role';

-- 5. Otorgar permisos completos al service_role en webhook_logs
GRANT ALL PRIVILEGES ON TABLE public.webhook_logs TO service_role;

-- 6. Verificar que el trigger handle_new_user funciona
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- 7. Verificar que la función handle_new_user existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 8. Verificar estructura de la tabla profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar que las políticas RLS están configuradas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 10. Crear política específica para service_role (si no existe)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- 11. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 12. Probar inserción con service_role (simulación)
-- NOTA: Esto es solo para verificar permisos, no ejecutar en producción
-- INSERT INTO public.profiles (id, full_name, user_name, email, gender, verification_status)
-- VALUES (
--     gen_random_uuid(),
--     'Test User',
--     'testuser_' || substr(gen_random_uuid()::text, 1, 8),
--     'test@example.com',
--     'female',
--     'pending'
-- );

-- 13. Verificar que se puede actualizar
-- UPDATE public.profiles 
-- SET verification_status = 'approved', didit_verified = true
-- WHERE email = 'test@example.com';

-- 14. Limpiar datos de prueba (si se ejecutó el test)
-- DELETE FROM public.profiles WHERE email = 'test@example.com';

-- ¡Permisos verificados y configurados! 🎉 