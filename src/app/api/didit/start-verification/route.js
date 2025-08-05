import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for verification processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { email, user_id } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    console.log('🚀 Starting verification for:', { email, user_id });

    // 1. Create Didit session
    const diditResponse = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': process.env.DIDIT_API_KEY
      },
      body: JSON.stringify({
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/didit/webhook`
      })
    });

    if (!diditResponse.ok) {
      console.error('❌ Error creating Didit session:', diditResponse.statusText);
      return NextResponse.json({
        success: false,
        error: 'Failed to create Didit session'
      }, { status: 500 });
    }

    const diditData = await diditResponse.json();
    const sessionId = diditData.session_id;
    const qrUrl = diditData.url;

    console.log('✅ Didit session created:', { sessionId, qrUrl });

    // 2. Create verification session (following official pattern)
    const verificationSession = {
      session_id: sessionId,
      status: 'NOT_STARTED',
      verification_data: {
        session_id: sessionId,
        status: 'Not Started',
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        created_at: new Date().toISOString()
      }
    };

    // If user_id is provided, link the session to the user
    if (user_id) {
      verificationSession.user_id = user_id;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('verification_sessions')
      .insert(verificationSession)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating verification session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create verification session'
      }, { status: 500 });
    }

    console.log('✅ Verification session created:', sessionData);

    // 3. Create user verification record
    const userVerification = {
      session_id: sessionId,
      status: 'pending',
      verification_data: {
        session_id: sessionId,
        status: 'Not Started',
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        created_at: new Date().toISOString()
      }
    };

    if (user_id) {
      userVerification.user_id = user_id;
    }

    const { data: verificationData, error: verificationError } = await supabase
      .from('user_verifications')
      .insert(userVerification)
      .select()
      .single();

    if (verificationError) {
      console.error('❌ Error creating user verification:', verificationError);
    } else {
      console.log('✅ User verification created:', verificationData);
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      verification_url: qrUrl,
      status: 'NOT_STARTED',
      message: 'Verification session created successfully'
    });

  } catch (error) {
    console.error('❌ Error starting verification:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 