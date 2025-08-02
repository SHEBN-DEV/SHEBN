/**
 * Configuración y validación de variables de entorno
 */

// Variables requeridas para el funcionamiento básico
const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Next.js
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
};

// Variables opcionales con valores por defecto
const optionalEnvVars = {
  // Didit (plan gratuito)
  DIDIT_API_KEY: process.env.DIDIT_API_KEY || 'free_plan',
  DIDIT_API_BASE_URL: process.env.DIDIT_API_BASE_URL || 'https://verification.didit.me',
  DIDIT_WORKFLOW_ID: process.env.DIDIT_WORKFLOW_ID || 'free_plan',
  DIDIT_WEBHOOK_SECRET: process.env.DIDIT_WEBHOOK_SECRET || 'free_plan_secret',
  
  // Otros
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};

/**
 * Valida que todas las variables requeridas estén presentes
 */
export function validateEnvVars() {
  const missingVars = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(key);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missingVars.join(', ')}\n` +
      'Por favor, verifica tu archivo .env.local'
    );
  }
  
  return true;
}

/**
 * Obtiene todas las variables de entorno validadas
 */
export function getEnvVars() {
  validateEnvVars();
  
  return {
    ...requiredEnvVars,
    ...optionalEnvVars,
  };
}

/**
 * Verifica si estamos en producción
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verifica si estamos en desarrollo
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Obtiene la URL base de la aplicación
 */
export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Configuración de Supabase
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

/**
 * Configuración de Didit
 */
export const diditConfig = {
  apiKey: process.env.DIDIT_API_KEY,
  apiBaseUrl: process.env.DIDIT_API_BASE_URL || 'https://api.didit.me',
  workflowId: process.env.DIDIT_WORKFLOW_ID,
  webhookSecret: process.env.DIDIT_WEBHOOK_SECRET,
};

// Validar variables en tiempo de importación (solo en desarrollo)
if (isDevelopment()) {
  try {
    validateEnvVars();
    console.log('✅ Variables de entorno validadas correctamente');
  } catch (error) {
    console.error('❌ Error en variables de entorno:', error.message);
    console.log('💡 Copia el archivo env.example a .env.local y configura las variables');
  }
} 