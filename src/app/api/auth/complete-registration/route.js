import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for registration processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { session_id, password } = await request.json();

    if (!session_id || !password) {
      return NextResponse.json({
        success: false,
        error: 'Session ID y password son requeridos'
      }, { status: 400 });
    }

    console.log('🔍 Completing registration for session:', session_id);

    // 1. Check verification status
    const { data: verificationSession, error: sessionError } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (sessionError) {
      console.error('❌ Error checking verification session:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'No se encontró la sesión de verificación'
      }, { status: 404 });
    }

    console.log('✅ Verification session found:', verificationSession);

    // 2. Check if verification is approved
    if (verificationSession.status !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: `La verificación no está aprobada. Estado actual: ${verificationSession.status}`,
        status: verificationSession.status
      }, { status: 400 });
    }

    // 3. Extract verification data
    const verificationData = verificationSession.verification_data;
    const registrationData = verificationData.registration_data;

    if (!verificationData.decision?.id_verification) {
      return NextResponse.json({
        success: false,
        error: 'Datos de verificación incompletos'
      }, { status: 400 });
    }

    const idVerification = verificationData.decision.id_verification;
    const verifiedGender = idVerification.gender;
    const verifiedFirstName = idVerification.first_name;
    const verifiedLastName = idVerification.last_name;
    const verifiedDateOfBirth = idVerification.date_of_birth;

    console.log('🔍 Verification data:', {
      verified_gender: verifiedGender,
      verified_first_name: verifiedFirstName,
      verified_last_name: verifiedLastName,
      verified_date_of_birth: verifiedDateOfBirth
    });

    // 4. Validate gender (must be 'F' for female)
    if (verifiedGender !== 'F') {
      return NextResponse.json({
        success: false,
        error: 'Solo se permiten registros de mujeres (género F)',
        verified_gender: verifiedGender,
        message: 'La verificación de identidad indica que no eres mujer. Solo se permiten registros de mujeres en esta plataforma.'
      }, { status: 403 });
    }

    console.log('✅ Gender validation passed (F)');

    // 5. Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: registrationData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: verifiedFirstName + ' ' + verifiedLastName,
        user_name: registrationData.user_name,
        gender: 'female', // Map 'F' to 'female'
        verification_status: 'approved',
        didit_verified: true,
        didit_session_id: session_id
      }
    });

    if (authError) {
      console.error('❌ Error creating user account:', authError);
      return NextResponse.json({
        success: false,
        error: 'Error al crear la cuenta de usuario'
      }, { status: 500 });
    }

    const userId = authData.user.id;
    console.log('✅ User account created:', userId);

    // 6. Update verification session with user_id
    const { error: updateSessionError } = await supabase
      .from('verification_sessions')
      .update({ user_id: userId })
      .eq('session_id', session_id);

    if (updateSessionError) {
      console.error('❌ Error updating verification session:', updateSessionError);
    } else {
      console.log('✅ Verification session updated with user_id');
    }

    // 7. Update user verification with user_id
    const { error: updateVerificationError } = await supabase
      .from('user_verifications')
      .update({ user_id: userId })
      .eq('session_id', session_id);

    if (updateVerificationError) {
      console.error('❌ Error updating user verification:', updateVerificationError);
    } else {
      console.log('✅ User verification updated with user_id');
    }

    // 8. Update profile with verification data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: verifiedFirstName + ' ' + verifiedLastName,
        user_name: registrationData.user_name,
        email: registrationData.email,
        gender: 'female',
        verification_status: 'approved',
        is_verified: true,
        date_of_birth: verifiedDateOfBirth,
        didit_verified: true,
        didit_session_id: session_id,
        didit_verification_data: verificationData
      })
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
    } else {
      console.log('✅ Profile updated with verification data');
    }

    return NextResponse.json({
      success: true,
      message: 'Registro completado exitosamente',
      user_id: userId,
      verification_data: {
        first_name: verifiedFirstName,
        last_name: verifiedLastName,
        gender: verifiedGender,
        date_of_birth: verifiedDateOfBirth,
        document_number: idVerification.document_number
      },
      registration_data: registrationData
    });

  } catch (error) {
    console.error('❌ Error completing registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 