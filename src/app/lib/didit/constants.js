export const DIDIT_CONFIG = {
  API_ENDPOINTS: {
    BASE: process.env.DIDIT_API_BASE_URL || 'https://api.didit.me',
    VERIFICATION: '/v1/verification/links',
    WEBHOOK_SECRET: process.env.DIDIT_WEBHOOK_SECRET
  },
  WORKFLOW_ID: process.env.DIDIT_WORKFLOW_ID
};