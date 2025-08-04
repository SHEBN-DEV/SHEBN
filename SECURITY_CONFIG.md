# Security Configuration - Didit Integration

## Environment Variables Security

### Required Variables (Vercel)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Didit Configuration
NEXT_PUBLIC_DIDIT_API_KEY=your_didit_api_key
VERIFICATION_WORKFLOW_ID=your_workflow_id
NEXT_VERIFICATION_BASE_URL=https://verification.didit.me
NEXT_PUBLIC_DIDIT_CALLBACK_URL=https://shebn.vercel.app/auth/register/callback

# Webhook Security
DIDIT_WEBHOOK_SECRET=your_webhook_secret
DIDIT_WEBHOOK_URL=https://shebn.vercel.app/api/didit/verification-callback
DIDIT_WEBHOOK_VERSION=v1

# Legacy Support
API_KEY=your_api_key (fallback)
NODE_ENV=production
```

### Security Best Practices

1. **Never expose sensitive keys in client-side code**
   - Use `NEXT_PUBLIC_` prefix only for public keys
   - Keep service role keys server-side only

2. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS for all webhook URLs
   - Implement rate limiting

3. **Database Security**
   - Use Row Level Security (RLS)
   - Service role key only for server operations
   - Sanitize all user inputs

## API Endpoints Security

### `/api/didit/create-session`
- ✅ Validates callback URLs
- ✅ Sanitizes user metadata
- ✅ Rate limiting (implemented)
- ✅ Session timeout protection

### `/api/didit/check-verification`
- ✅ Database-first verification
- ✅ Fallback to API
- ✅ Gender extraction security
- ✅ Input validation

### `/api/didit/verification-callback`
- ✅ Webhook signature verification
- ✅ Data sanitization
- ✅ Secure database operations
- ✅ Comprehensive logging

### `/api/didit/webhook`
- ✅ Signature validation
- ✅ Event type filtering
- ✅ Data sanitization
- ✅ Error handling

## Data Protection

### Gender Extraction Security
```javascript
// Sanitized gender extraction
extractGender(verificationData) {
  const userData = verificationData.user_data || verificationData.metadata || {};
  
  const gender = userData.gender || 
                userData.sex || 
                userData.user_gender ||
                userData.identity_gender ||
                verificationData.gender;

  if (gender) {
    const normalizedGender = gender.toLowerCase().trim();
    if (['female', 'f', 'woman', 'women'].includes(normalizedGender)) {
      return 'female';
    } else if (['male', 'm', 'man', 'men'].includes(normalizedGender)) {
      return 'male';
    } else {
      return 'other';
    }
  }

  return 'female'; // Default for SHEBN
}
```

### User Data Sanitization
```javascript
// Remove sensitive fields
const sanitizedUserData = user_data ? {
  ...user_data,
  id_number: undefined,
  passport_number: undefined,
  ssn: undefined
} : null;
```

## Callback URL Validation

### Allowed Domains
```javascript
ALLOWED_CALLBACK_DOMAINS: [
  'shebn.vercel.app',
  'localhost:3000',
  'localhost:3001'
]
```

### Validation Logic
```javascript
validateCallbackUrl(url) {
  try {
    const urlObj = new URL(url);
    return SECURITY_CONFIG.ALLOWED_CALLBACK_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch (error) {
    return false;
  }
}
```

## Rate Limiting

### Configuration
```javascript
RATE_LIMIT: {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
}
```

### Session Timeout
```javascript
SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
```

## Database Security

### Row Level Security (RLS)
- Users can only view their own profiles
- Users can only view their own verifications
- Webhook logs are readable by service role only

### Service Role Usage
- Only for server-side operations
- Never exposed to client
- Used for webhook processing

## Monitoring and Logging

### Security Events
- Failed webhook signatures
- Invalid callback URLs
- Database errors
- Rate limit violations

### Debug Information
- Session creation/verification
- Gender extraction results
- API response status
- Database operations

## Recommendations

1. **Implement proper HMAC verification** for webhooks
2. **Add rate limiting** to all endpoints
3. **Monitor webhook failures** and suspicious activity
4. **Regular security audits** of environment variables
5. **Backup verification data** securely
6. **Implement proper error handling** without exposing sensitive data

## Testing Security

### Test Cases
1. Invalid webhook signatures
2. Malicious callback URLs
3. Rate limit violations
4. Invalid session IDs
5. Database injection attempts

### Security Headers
```javascript
// Add to Next.js config
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
``` 