import { NextResponse } from 'next/server';
import { supabase, validateSupabaseConnection } from '../../../SupabaseClient';
import { didit } from '../../lib/didit/client';
import { validateEnvVars } from '../../../lib/env';

export async function POST(request) {
  try {
    // Validación de seguridad crítica
    if (!validateSupabaseConnection()) {
      return NextResponse.json(
        { error: 'Configuración de seguridad incompleta' },
        { status: 500 }
      );
    }

    const { email, password, fullName, userName, gender } = await request.json();

    // Validar que el género sea femenino
    if (gender !== 'female') {
      return NextResponse.json(
        { error: 'Solo se permiten registros de género femenino' },
        { status: 403 }
      );
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Crear perfil en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        user_name: userName,
        email,
        gender,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // Generar verificación de Didit
    try {
      const { verification_url } = await didit.startVerification(userId, {
        email,
        name: fullName,
        gender
      });

      return NextResponse.json({
        success: true,
        user: authData.user,
        verification_url
      });
    } catch (diditError) {
      // Si falla Didit, aún creamos el usuario pero marcamos como error
      await supabase
        .from('profiles')
        .update({ verification_status: 'error' })
        .eq('id', userId);

      return NextResponse.json({
        success: true,
        user: authData.user,
        error: 'Error al generar verificación de identidad'
      });
    }

  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 