export const DIDIT_CONFIG = {
  API_ENDPOINTS: {
    BASE: process.env.DIDIT_API_BASE_URL || 'https://api.didit.me',
    VERIFICATION: process.env.DIDIT_VERIFICATION_URL || 'https://verification.didit.me',
    SESSIONS: '/v1/sessions',
    VERIFICATION_SESSIONS: '/v2/session/'
  },
  API_KEY: process.env.API_KEY || 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw',
  WORKFLOW_ID: process.env.VERIFICATION_WORKFLOW_ID || 'cf449f7e-1848-4e21-a9b4-084000bfdc26',
  WEBHOOK_SECRET: process.env.DIDIT_WEBHOOK_SECRET,
  CALLBACK_URL: process.env.VERIFICATION_CALLBACK_URL || 'https://shebn.vercel.app/auth/register/callback'
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  FAILED: 'failed',
  EXPIRED: 'expired',
  ERROR: 'error'
};

export const GENDER_OPTIONS = {
  FEMALE: 'female',
  MALE: 'male',
  OTHER: 'other'
};

export const WEBHOOK_EVENTS = {
  VERIFICATION_COMPLETED: 'verification.completed',
  VERIFICATION_DECLINED: 'verification.declined',
  VERIFICATION_FAILED: 'verification.failed',
  SESSION_CREATED: 'session.created',
  SESSION_UPDATED: 'session.updated'
};

// Security configuration
export const SECURITY_CONFIG = {
  // Only allow these domains for callbacks
  ALLOWED_CALLBACK_DOMAINS: [
    'shebn.vercel.app',
    'localhost:3000',
    'localhost:3001'
  ],
  
  // Rate limiting for verification attempts
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  
  // Session timeout
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};