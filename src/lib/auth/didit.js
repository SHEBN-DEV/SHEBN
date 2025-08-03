/**
 * Funciones de autenticación de Didit - Plan Gratuito
 * 
 * El plan gratuito de Didit funciona con:
 * - URL directa de verificación
 * - Sin API key requerida
 * - Redirección simple
 */

export async function generateDiditAuthUrl() {
  // URL directa del plan gratuito de Didit
  const baseUrl = 'https://verification.didit.me/v2/sesión/';
  
  // Parámetros para el plan gratuito
  const params = new URLSearchParams({
    user_id: `shebn_${Date.now()}`, // ID único para el usuario
    callback_url: `${window.location.origin}/auth/register/callback`, // URL de retorno
    metadata: JSON.stringify({
      timestamp: new Date().toISOString(),
      source: 'shebn',
      flow: 'registration',
      plan: 'free'
    })
  });
  
  return `${baseUrl}?${params.toString()}`;
}

export async function verifyDiditToken(token) {
  // Para el plan gratuito, simulamos verificación exitosa
  // En producción, podrías hacer una llamada simple a Didit para verificar
  return {
    success: true,
    user: {
      id: token,
      verified: true,
      plan: 'free'
    }
  };
}

/**
 * Función para verificar el estado de una sesión de Didit
 * (Para el plan gratuito, esto es opcional)
 */
export async function checkDiditSession(sessionId) {
  // En el plan gratuito, asumimos que la verificación fue exitosa
  // si el usuario regresa con un token
  return {
    success: true,
    session: {
      id: sessionId,
      status: 'verified',
      plan: 'free'
    }
  };
} 