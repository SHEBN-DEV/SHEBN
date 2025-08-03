import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar service role key para permisos de lectura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    console.log('🔍 Verificando estado de verificación para:', email);

    // Buscar en user_verifications
    const { data: verificationData, error: verificationError } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('verification_provider', 'didit')
      .eq('verification_data->email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verificationError && verificationError.code !== 'PGRST116') {
      console.error('❌ Error buscando verificación:', verificationError);
      return NextResponse.json({ error: 'Error buscando verificación' }, { status: 500 });
    }

    if (verificationData) {
      console.log('✅ Verificación encontrada:', verificationData);
      
      const isVerified = verificationData.status === 'approved' || verificationData.status === 'success';
      
      return NextResponse.json({
        verified: isVerified,
        status: verificationData.status,
        sessionId: verificationData.provider_verification_id,
        verifiedAt: verificationData.created_at,
        email: email
      });
    } else {
      console.log('⚠️ No se encontró verificación para:', email);
      
      return NextResponse.json({
        verified: false,
        status: 'not_found',
        message: 'No se encontró verificación para este email'
      });
    }

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
} 