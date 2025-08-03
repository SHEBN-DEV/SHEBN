import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../../lib/env";

// Crear cliente de Supabase con validación condicional
let supabase = null;
let supabaseAdmin = null;

try {
  if (supabaseConfig.url && supabaseConfig.anonKey) {
    supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    
    // Cliente de Supabase con permisos de servicio (solo para operaciones del servidor)
    if (supabaseConfig.serviceRoleKey) {
      supabaseAdmin = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    }
  } else {
    console.warn('⚠️ Configuración de Supabase incompleta. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
} catch (error) {
  console.error('❌ Error inicializando Supabase:', error.message);
}

export { supabase, supabaseAdmin };