import { NextResponse } from 'next/server';
import { didit } from '../../../lib/didit/client';
import { DIDIT_CONFIG } from '../../../lib/didit/constants';

// GET method to test that the endpoint exists
export async function GET() {
  return NextResponse.json({ 
    message: 'Didit create-session endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'active',
    config: {
      hasApiKey: !!DIDIT_CONFIG.API_KEY,
      hasWorkflowId: !!DIDIT_CONFIG.WORKFLOW_ID,
      callbackUrl: DIDIT_CONFIG.CALLBACK_URL
    }
  });
}

export async function POST(request) {
  try {
    const { email, userId, metadata = {} } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    console.log('🔧 Creating Didit session from backend...');
    console.log('📋 Request data:', { 
      email: email ? 'Present' : 'Missing',
      userId: userId || 'Not provided',
      hasMetadata: Object.keys(metadata).length > 0
    });
    
    // Generate a unique userId if not provided
    const finalUserId = userId || `shebn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create callback URL with user data
    const callbackUrl = `${DIDIT_CONFIG.CALLBACK_URL}?user_data=${encodeURIComponent(email)}&user_id=${finalUserId}`;
    
    console.log('📤 Creating session with Didit client...');
    
    // Use the new expert Didit client
    const sessionData = await didit.createSession({
      userId: finalUserId,
      email: email,
      metadata: {
        ...metadata,
        platform: 'shebn',
        registration_step: 'verification'
      },
      callbackUrl: callbackUrl
    });

    console.log('✅ Session created successfully:', {
      session_id: sessionData.session_id,
      has_verification_url: !!sessionData.verification_url,
      status: sessionData.status
    });

    // Store session data in database for tracking
    try {
      // This would typically be stored in a database
      // For now, we'll just log it
      console.log('💾 Session data for storage:', {
        session_id: sessionData.session_id,
        user_email: email,
        user_id: finalUserId,
        status: sessionData.status,
        created_at: sessionData.created_at
      });
    } catch (dbError) {
      console.warn('⚠️ Error storing session data:', dbError);
      // Continue even if database storage fails
    }
    
    return NextResponse.json({
      success: true,
      verification_url: sessionData.verification_url,
      session_id: sessionData.session_id,
      status: sessionData.status,
      created_at: sessionData.created_at
    });

  } catch (error) {
    console.error('❌ Error in create-session:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error creating verification session',
      details: error.message
    }, { status: 500 });
  }
} 