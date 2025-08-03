import { createClient } from "@supabase/supabase-js";

// Validación de seguridad
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar configuración crítica
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuración de Supabase incompleta - Variables críticas faltantes');
}

// Crear cliente de Supabase
export const supabase = createClient(
  supabaseUrl || 'https://invalid-url.supabase.co',
  supabaseAnonKey || 'invalid-key'
);

// Cliente de Supabase con permisos de servicio (solo para operaciones críticas)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl || '', process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Función de validación de seguridad
export function validateSupabaseConnection() {
  return !!(supabaseUrl && supabaseAnonKey);
}