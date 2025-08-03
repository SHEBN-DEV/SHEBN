/**
 * Funciones de autenticación de Didit
 */

export async function generateDiditAuthUrl() {
  // Para el plan gratuito, usamos la URL directa
  const baseUrl = 'https://verification.didit.me/v2/sesión/';
  const params = new URLSearchParams({
    user_id: Date.now().toString(), // ID temporal
    callback_url: `${window.location.origin}/auth/register/callback`, // URL de callback
    metadata: JSON.stringify({
      timestamp: new Date().toISOString(),
      source: 'shebn',
      flow: 'registration'
    })
  });
  
  return `${baseUrl}?${params.toString()}`;
}

export async function verifyDiditToken(token) {
  // Para el plan gratuito, simulamos verificación
  return {
    success: true,
    user: {
      id: token,
      verified: true
    }
  };
} 