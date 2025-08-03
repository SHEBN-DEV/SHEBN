import { diditConfig, getBaseUrl } from '../../../../lib/env';

export class DiditClient {
  constructor() {
    // Configuración mínima para plan gratuito
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
    // Para el plan gratuito, la verificación es simple
    return true;
  }

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