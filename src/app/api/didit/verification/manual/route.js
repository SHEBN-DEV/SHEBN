import { NextResponse } from 'next/server';
import { supabase } from '../../../../SupabaseClient';

export async function POST(request) {
  try {
    const { userId, verificationData } = await request.json();

    // Para el plan gratuito, simulamos la verificación
    // En un caso real, aquí verificarías los datos con Didit
    
    // Actualizar el estado de verificación en Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        verification_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Error actualizando estado de verificación' },
        { status: 500 }
      );
    }

    // Registrar en la tabla de verificaciones
    await supabase
      .from('user_verifications')
      .insert({
        user_id: userId,
        status: 'completed',
        verification_data: verificationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      status: 'completed',
      message: 'Verificación completada exitosamente'
    });

  } catch (error) {
    console.error('Error en verificación manual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 