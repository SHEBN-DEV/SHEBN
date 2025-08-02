import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../../lib/env";

// Validar configuración de Supabase
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error(
    'Configuración de Supabase incompleta. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Cliente de Supabase con permisos de servicio (solo para operaciones del servidor)
export const supabaseAdmin = supabaseConfig.serviceRoleKey 
  ? createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey)
  : null;