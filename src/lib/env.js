/**
 * Configuración segura de variables de entorno para Web3
 */

// Variables críticas para seguridad
const criticalEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Variables opcionales con valores por defecto seguros
const optionalEnvVars = {
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://shebn.vercel.app',
  NODE_ENV: process.env.NODE_ENV || 'production',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Configuración de Supabase (con validación de seguridad)
export const supabaseConfig = {
  url: criticalEnvVars.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: criticalEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: optionalEnvVars.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Configuración de Didit (plan gratuito pero seguro)
export const diditConfig = {
  apiKey: process.env.API_KEY || 'free_plan',
  apiBaseUrl: process.env.NEXT_VERIFICATION_BASE_URL || 'https://verification.didit.me',
  workflowId: process.env.VERIFICATION_WORKFLOW_ID || 'free_plan',
  webhookSecret: process.env.VERIFICATION_CALLBACK_URL || 'free_plan_secret',
};

// Funciones de utilidad
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

export function getBaseUrl() {
  return optionalEnvVars.NEXT_PUBLIC_BASE_URL;
}

// Validación de seguridad (solo en runtime, no en build)
export function validateEnvVars() {
  const missingVars = [];
  
  for (const [key, value] of Object.entries(criticalEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`❌ Variables críticas faltantes: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

export function getEnvVars() {
  return {
    ...criticalEnvVars,
    ...optionalEnvVars,
  };
} 