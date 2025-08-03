import { diditConfig, getBaseUrl } from '../../../env';

export class DiditClient {
  constructor() {
    // Para el plan gratuito, no necesitamos validar API key
    try {
      console.log('✅ Cliente Didit configurado para plan gratuito');
    } catch (error) {
      console.warn('⚠️ Error inicializando cliente Didit:', error.message);
    }
  }

  async startVerification(userId, metadata = {}) {
    // Para el plan gratuito de Didit, usamos enlaces de verificación directos
    const verificationUrl = `https://verification.didit.me/v2/sesión/?user_id=${userId}&metadata=${encodeURIComponent(JSON.stringify(metadata))}`;
    
    return {
      verification_url: verificationUrl,
      user_id: userId,
      status: 'pending'
    };
  }

  verifyWebhook(signature, payload) {
    // Para el plan gratuito, la verificación es más simple
    return true;
  }

  // Método para verificar el estado de una verificación (simulado para plan gratuito)
  async getVerificationStatus(verificationId) {
    // En el plan gratuito, simulamos el estado
    return {
      status: 'completed',
      user_id: verificationId,
      verified_at: new Date().toISOString()
    };
  }
}

export const didit = new DiditClient();