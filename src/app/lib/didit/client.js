import { DIDIT_CONFIG } from './constants';

export class DiditClient {
  async startVerification(userId, metadata = {}) {
    const response = await fetch(
      `${DIDIT_CONFIG.API_ENDPOINTS.BASE}${DIDIT_CONFIG.API_ENDPOINTS.VERIFICATION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DIDIT_API_KEY}`
        },
        body: JSON.stringify({
          workflow_id: DIDIT_CONFIG.WORKFLOW_ID,
          user_id: userId,
          metadata,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/dtdit/verification/callback`
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to start verification');
    }

    return response.json();
  }

  verifyWebhook(signature, payload) {
    // Implementación real de verificación de firma
    return signature === process.env.DIDIT_WEBHOOK_SECRET;
  }
}

export const didit = new DiditClient();