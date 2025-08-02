import { NextResponse } from 'next/server';
import { supabase } from '../../../../SupabaseClient';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('user_id');
  const verificationData = searchParams.get('verification_data');

  if (!status || !userId) {
    return NextResponse.redirect(new URL('/auth/verification/status?error=missing_params', request.url));
  }

  try {
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gender, verification_status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      return NextResponse.redirect(new URL('/auth/verification/status?error=profile_not_found', request.url));
    }

    // Validar que el usuario sea de género femenino
    if (profile.gender !== 'female') {
      // Actualizar estado como rechazado por género
      await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected_gender',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return NextResponse.redirect(new URL('/auth/verification/status?error=gender_not_allowed', request.url));
    }

    // Procesar el resultado de la verificación
    let finalStatus = 'pending';
    
    if (status === 'completed') {
      // Verificar que la verificación de Didit confirme género femenino
      // Aquí deberías implementar la lógica específica de Didit para validar el género
      // Por ahora asumimos que si Didit aprueba, es porque es mujer
      finalStatus = 'completed';
    } else if (status === 'rejected') {
      finalStatus = 'rejected';
    } else if (status === 'expired') {
      finalStatus = 'expired';
    }

    // Actualizar el estado de verificación
    await supabase
      .from('profiles')
      .update({
        verification_status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Registrar en la tabla de verificaciones
    await supabase
      .from('user_verifications')
      .upsert({
        user_id: userId,
        status: finalStatus,
        verification_data: verificationData,
        updated_at: new Date().toISOString()
      });

    return NextResponse.redirect(new URL(`/auth/verification/status?status=${finalStatus}`, request.url));
  } catch (error) {
    console.error('Error en callback de verificación:', error);
    return NextResponse.redirect(new URL('/auth/verification/status?error=internal_error', request.url));
  }
}