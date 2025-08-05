import { NextResponse } from 'next/server';
import { didit } from '../../../lib/didit/client';

// GET method to test that the endpoint exists
export async function GET() {
  return NextResponse.json({ 
    message: 'Didit create-session endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'active'
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
    const callbackUrl = `https://shebn.vercel.app/auth/register/callback?user_data=${encodeURIComponent(email)}&user_id=${finalUserId}`;
    
    console.log('📤 Creating session with Didit client...');
    
    // Use the simplified Didit client
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