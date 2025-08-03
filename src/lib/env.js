/**
 * Configuración de variables de entorno - Plan Gratuito
 * 
 * Esta configuración está optimizada para el plan gratuito de:
 * - Supabase (hasta 50,000 MAU)
 * - Didit (verificación básica)
 * - Vercel (deployment gratuito)
 */

// Configuración de Supabase (Plan Gratuito)
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

// Configuración de Didit (Plan Gratuito)
export const diditConfig = {
  // API Key configurada en el dashboard de Didit
  apiKey: process.env.DIDIT_API_KEY || '',
  
  // URL base de Didit
  baseUrl: 'https://verification.didit.me/v2/sesión/',
  
  // Versión del webhook (V.1 o V.2)
  webhookVersion: process.env.DIDIT_WEBHOOK_VERSION || 'V.2',
  
  // URL del webhook configurada en Didit
  webhookUrl: process.env.DIDIT_WEBHOOK_URL || 'https://shebn.vercel.app/api/didit/webhook',
  
  // Plan actual
  plan: 'free',
  
  // URL de callback se genera dinámicamente
  callbackUrl: process.env.NEXT_PUBLIC_DIDIT_CALLBACK_URL || ''
};

// Función para obtener la URL base de la aplicación
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Para SSR, usar variable de entorno o valor por defecto
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://shebn.vercel.app';
}

// Función para verificar si estamos en producción
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

// Función para verificar si estamos en desarrollo
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

// Variables opcionales para funcionalidades adicionales
export const optionalEnvVars = {
  // Para analytics (opcional)
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
  
  // Para notificaciones (opcional)
  notificationKey: process.env.NEXT_PUBLIC_NOTIFICATION_KEY || '',
  
  // Para integraciones adicionales (opcional)
  integrationToken: process.env.NEXT_PUBLIC_INTEGRATION_TOKEN || ''
}; 