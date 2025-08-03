import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Usar service role key para permisos de escritura
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Clave privilegiada para escritura
);

// Función de verificación HMAC
function verifySignature(payload, signature) {
  if (!signature || !process.env.DIDIT_WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac('sha256', process.env.DIDIT_WEBHOOK_SECRET);
  const expectedSignature = hmac.update(payload).digest('hex');
  return signature === expectedSignature;
}

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

    // Obtener headers para verificación HMAC
    const signature = request.headers.get('x-didit-signature');
    const payload = await request.text();
    
    console.log('🔐 Verificando firma HMAC...');
    console.log('📝 Payload recibido:', payload);
    console.log('🔑 Firma recibida:', signature);

    // Verificar firma HMAC si está disponible
    if (signature && process.env.DIDIT_WEBHOOK_SECRET) {
      const isValid = verifySignature(payload, signature);
      if (!isValid) {
        console.error('❌ Firma HMAC inválida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Firma HMAC válida');
    } else {
      console.warn('⚠️ No se pudo verificar firma HMAC (continuando...)');
    }

    // Parsear el payload
    const webhookData = JSON.parse(payload);
    
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

           // Actualizar el perfil con el status del webhook usando service role
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
           
           // Intentar buscar por email si tenemos user_data
           if (webhookData.user_data) {
             console.log('🔍 Buscando por email:', webhookData.user_data);
             
             const { data: emailProfile, error: emailError } = await supabase
               .from('profiles')
               .select('*')
               .eq('email', webhookData.user_data)
               .single();
             
             if (emailProfile) {
               console.log('✅ Perfil encontrado por email:', emailProfile.email);
               
               // Actualizar perfil encontrado por email
               const { data: emailUpdateData, error: emailUpdateError } = await supabase
                 .from('profiles')
                 .update({
                   verification_status: status,
                   didit_verified: status === 'approved' || status === 'success',
                   didit_session_id: session_id,
                   verification_data: {
                     ...webhookData,
                     webhook_received_at: new Date().toISOString()
                   },
                   updated_at: new Date().toISOString()
                 })
                 .eq('email', webhookData.user_data)
                 .select();
               
               if (emailUpdateError) {
                 console.error('❌ Error actualizando perfil por email:', emailUpdateError);
               } else {
                 console.log('✅ Perfil actualizado por email:', emailUpdateData);
               }
             } else {
               console.log('⚠️ No se encontró perfil por email tampoco');
             }
           }
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