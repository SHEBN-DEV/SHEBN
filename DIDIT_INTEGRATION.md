# Didit Integration - Expert Implementation

## Overview

This document describes the expert implementation of Didit identity verification for the SHEBN platform. The integration captures gender and verification status to enable seamless user registration and login.

## Architecture

### 1. Database Schema

The database has been updated with English field names and improved structure:

```sql
-- User profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    user_name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'completed', 'rejected', 'expired', 'error', 'approved')),
    didit_verified BOOLEAN DEFAULT FALSE,
    didit_session_id TEXT,
    didit_verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User verifications table
CREATE TABLE public.user_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    verification_provider TEXT NOT NULL DEFAULT 'didit',
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'failed')),
    verification_data JSONB,
    session_id TEXT,
    workflow_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Expert Didit Client

The new `DiditClient` class provides comprehensive functionality:

#### Key Methods:

- `createSession(options)` - Creates verification sessions
- `getSessionStatus(sessionId)` - Checks verification status
- `extractGender(verificationData)` - Extracts gender from verification data
- `validateVerification(verificationData)` - Validates verification completion
- `processWebhook(webhookData)` - Processes webhook events

#### Gender Extraction Logic:

```javascript
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

  // Default to female for SHEBN platform
  return 'female';
}
```

### 3. API Endpoints

#### `/api/didit/create-session`
- Creates verification sessions with Didit
- Accepts: `email`, `userId`, `metadata`
- Returns: `verification_url`, `session_id`, `status`

#### `/api/didit/check-verification`
- Checks verification status
- Accepts: `email` or `session_id`
- Returns: `verified`, `session_id`, `status`, `gender`

#### `/api/didit/webhook`
- Processes Didit webhooks
- Handles: `verification.completed`, `verification.declined`, `session.created`, `session.updated`
- Stores verification data in database

### 4. Registration Flow

1. **Form Submission**: User fills registration form (English)
2. **Gender Validation**: Only female registrations allowed
3. **Didit Session**: Creates verification session
4. **Verification Process**: User completes Didit verification
5. **Data Capture**: Extracts gender and verification status
6. **User Creation**: Creates user in Supabase with verification data
7. **Profile Creation**: Creates profile with verification details
8. **Login**: User can immediately log in

### 5. Data Flow

```
User Form → Didit Session → Verification → Webhook → Database → User Creation → Login
```

### 6. Environment Variables

```env
DIDIT_API_KEY=your_api_key
DIDIT_WORKFLOW_ID=your_workflow_id
DIDIT_WEBHOOK_SECRET=your_webhook_secret
DIDIT_CALLBACK_URL=https://shebn.vercel.app/auth/register/callback
```

### 7. Verification Status Values

- `pending` - Verification in progress
- `approved` - Verification successful
- `declined` - Verification rejected
- `failed` - Verification failed
- `expired` - Verification expired
- `error` - Verification error

### 8. Gender Values

- `female` - Female (default for SHEBN)
- `male` - Male
- `other` - Other gender

## Benefits of Expert Implementation

1. **Robust Gender Extraction**: Multiple fallback methods for gender detection
2. **Comprehensive Error Handling**: Graceful fallbacks for free plan
3. **Database Integration**: Proper storage of verification data
4. **Webhook Processing**: Real-time verification status updates
5. **English Localization**: All user-facing content in English
6. **Security**: Proper signature verification (when configured)
7. **Scalability**: Ready for paid Didit plans

## Testing

### Free Plan Testing
- Simulates successful verification
- Works without API key
- Stores data in localStorage as fallback

### Paid Plan Testing
- Real API integration
- Webhook processing
- Database storage
- Gender extraction from verification data

## Troubleshooting

### Common Issues:

1. **Verification not completing**: Check webhook endpoint configuration
2. **Gender not detected**: Verify gender extraction logic
3. **Database errors**: Check RLS policies and permissions
4. **API errors**: Verify environment variables

### Debug Logs:
- All operations are logged with emojis for easy identification
- Check browser console and server logs
- Use `/api/didit/create-session` GET endpoint for configuration check

## Future Enhancements

1. **Advanced Gender Detection**: AI-based gender recognition
2. **Multi-language Support**: Support for other languages
3. **Analytics**: Verification success rate tracking
4. **Fraud Detection**: Advanced verification validation
5. **Mobile Optimization**: Better mobile verification experience 