import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for registration processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { email, full_name, user_name, gender } = await request.json();

    if (!email || !full_name || !user_name || !gender) {
      return NextResponse.json({
        success: false,
        error: 'Todos los campos son requeridos: email, full_name, user_name, gender'
      }, { status: 400 });
    }

    console.log('🚀 Starting registration process for:', { email, full_name, user_name, gender });

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
        error: 'Error al crear sesión de verificación'
      }, { status: 500 });
    }

    const diditData = await diditResponse.json();
    const sessionId = diditData.session_id;
    const qrUrl = diditData.url;

    console.log('✅ Didit session created:', { sessionId, qrUrl });

    // 2. Create verification session
    const verificationSession = {
      session_id: sessionId,
      status: 'NOT_STARTED',
      verification_data: {
        session_id: sessionId,
        status: 'Not Started',
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        registration_data: {
          email,
          full_name,
          user_name,
          gender
        },
        created_at: new Date().toISOString()
      }
    };

    const { data: sessionData, error: sessionError } = await supabase
      .from('verification_sessions')
      .insert(verificationSession)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating verification session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Error al crear sesión de verificación'
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
        registration_data: {
          email,
          full_name,
          user_name,
          gender
        },
        created_at: new Date().toISOString()
      }
    };

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
      message: 'Proceso de registro iniciado. Escanea el QR para verificar tu identidad.',
      registration_data: {
        email,
        full_name,
        user_name,
        gender
      }
    });

  } catch (error) {
    console.error('❌ Error starting registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 