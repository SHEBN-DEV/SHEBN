import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const sessionId = searchParams.get('session_id');

    if (!userId && !sessionId) {
      return NextResponse.json({ 
        error: 'Se requiere user_id o session_id' 
      }, { status: 400 });
    }

    let query = supabase
      .from('user_verifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (sessionId) {
      query = query.eq('provider_verification_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error checking verification:', error);
      return NextResponse.json({ 
        error: 'Error al verificar estado' 
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        verified: false,
        status: 'not_found',
        message: 'No se encontró verificación para este usuario'
      });
    }

    const verification = data[0];
    const verificationData = verification.verification_data || {};
    const personalInfo = verificationData.personal_info || {};
    const documentInfo = verificationData.document_info || {};
    
    return NextResponse.json({
      verified: verification.status === 'approved',
      status: verification.status,
      gender: personalInfo.gender,
      first_name: personalInfo.first_name,
      last_name: personalInfo.last_name,
      document_number: documentInfo.document_number,
      date_of_birth: personalInfo.date_of_birth,
      issuing_state: documentInfo.issuing_state,
      created_at: verification.created_at,
      updated_at: verification.updated_at,
      session_id: verification.provider_verification_id
    });

  } catch (error) {
    console.error('❌ Error in check verification:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 