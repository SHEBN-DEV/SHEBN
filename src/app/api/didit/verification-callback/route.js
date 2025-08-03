import { NextResponse } from 'next/server';
import { supabase } from '../../../SupabaseClient';

// GET method para probar que el endpoint existe
export async function GET() {
  return NextResponse.json({ 
    message: 'Didit verification-callback endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
}

export async function POST(request) {
  try {
    console.log('🔔 Webhook recibido de Didit');
    
    // Obtener el body del webhook
    const webhookData = await request.json();
    
    console.log('📥 Datos del webhook:', webhookData);
    
    // Extraer información esencial
    const { session_id, status, created_at } = webhookData;
    
    if (!session_id) {
      console.error('❌ Webhook sin session_id');
      return NextResponse.json({ error: 'session_id requerido' }, { status: 400 });
    }
    
    console.log('🔍 Procesando webhook para sesión:', session_id);
    
    // Buscar usuario por session_id en la tabla profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('didit_session_id', session_id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error buscando perfil:', profileError);
    }
    
    if (profileData) {
      console.log('✅ Perfil encontrado:', profileData.email);
      
      // Actualizar el perfil con el status del webhook
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: status,
          didit_verified: status === 'approved' || status === 'success',
          verification_data: {
            ...webhookData,
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('didit_session_id', session_id)
        .select();
      
      if (updateError) {
        console.error('❌ Error actualizando perfil:', updateError);
        return NextResponse.json({ error: 'Error actualizando perfil' }, { status: 500 });
      }
      
      console.log('✅ Perfil actualizado:', updateData);
    } else {
      console.log('⚠️ No se encontró perfil para session_id:', session_id);
    }
    
    // Guardar log del webhook
    try {
      const { error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          session_id: session_id,
          webhook_data: webhookData,
          status: status,
          received_at: new Date().toISOString()
        });
      
      if (logError) {
        console.warn('⚠️ Error guardando log del webhook:', logError);
      } else {
        console.log('✅ Log del webhook guardado');
      }
    } catch (logError) {
      console.warn('⚠️ Error guardando log del webhook:', logError);
    }
    
    console.log('✅ Webhook procesado exitosamente');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook procesado',
      session_id: session_id,
      status: status
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
} 