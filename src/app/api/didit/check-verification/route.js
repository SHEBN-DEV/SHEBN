import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for verification checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({
        verified: false,
        status: 'error',
        message: 'Session ID is required'
      }, { status: 400 });
    }

    console.log('🔍 Checking verification for session:', sessionId);

    // 1. Check verification_sessions table (following official pattern)
    const { data: verificationSession, error: sessionError } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ Error checking verification session:', sessionError);
      return NextResponse.json({
        verified: false,
        status: 'not_found',
        message: 'No se encontró verificación para este usuario'
      });
    }

    console.log('✅ Verification session found:', verificationSession);

    // 2. Check user_verifications table
    const { data: userVerification, error: verificationError } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (verificationError) {
      console.error('❌ Error checking user verification:', verificationError);
    } else {
      console.log('✅ User verification found:', userVerification);
    }

    // 3. Determine verification status
    const isApproved = verificationSession.status === 'APPROVED';
    const verificationData = verificationSession.verification_data;

    if (isApproved && verificationData?.decision?.id_verification) {
      const idVerification = verificationData.decision.id_verification;
      
      console.log('🎉 Verification approved:', {
        session_id: sessionId,
        first_name: idVerification.first_name,
        last_name: idVerification.last_name,
        gender: idVerification.gender,
        document_number: idVerification.document_number
      });

      return NextResponse.json({
        verified: true,
        status: 'approved',
        session_id: sessionId,
        gender: idVerification.gender,
        first_name: idVerification.first_name,
        last_name: idVerification.last_name,
        document_number: idVerification.document_number,
        date_of_birth: idVerification.date_of_birth,
        verification_data: verificationData
      });
    } else {
      console.log('⏳ Verification not yet approved:', verificationSession.status);
      
      return NextResponse.json({
        verified: false,
        status: verificationSession.status.toLowerCase(),
        session_id: sessionId,
        message: `Verificación en estado: ${verificationSession.status}`
      });
    }

  } catch (error) {
    console.error('❌ Error checking verification:', error);
    return NextResponse.json({
      verified: false,
      status: 'error',
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
} 