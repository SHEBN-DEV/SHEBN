-- =====================================================
-- CORRECCIÓN DEL TRIGGER handle_new_user
-- Verificar y corregir el trigger que no funciona
-- =====================================================

-- 1. Verificar si el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- 2. Eliminar el trigger si existe (para recrearlo)
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 3. Crear el trigger correctamente
CREATE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Verificar que la función handle_new_user existe y está correcta
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar en profiles con todos los campos necesarios
    INSERT INTO public.profiles (
        id,
        full_name,
        user_name,
        email,
        gender,
        verification_status,
        didit_verified,
        didit_session_id,
        verification_data,
        created_at,
        updated_at
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
        END,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 5. Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';

-- 6. Verificar que la función se creó correctamente
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 7. Probar el trigger con un usuario de prueba (opcional)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
-- VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     crypt('password123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW(),
--     '{"full_name": "Test User", "user_name": "testuser", "gender": "female"}'::jsonb
-- );

-- 8. Verificar que se creó el perfil (después del test)
-- SELECT * FROM public.profiles WHERE email = 'test@example.com';

-- 9. Limpiar el usuario de prueba (opcional)
-- DELETE FROM auth.users WHERE email = 'test@example.com';
-- DELETE FROM public.profiles WHERE email = 'test@example.com'; 