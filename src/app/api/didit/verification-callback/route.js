import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '../../../SupabaseClient';
import crypto from 'crypto';

// GET method for testing webhook endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Didit webhook endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
}

export async function POST(request) {
  const headersList = headers();
  const signature = headersList.get('x-didit-signature');
  const requestBody = await request.clone().text();

  console.log('🔔 Didit webhook received:', {
    signature: signature ? 'present' : 'missing',
    timestamp: new Date().toISOString()
  });

  // 1. Validar firma HMAC
  if (!verifyDiditSignature(requestBody, signature)) {
    console.error('❌ Invalid Didit signature');
    return NextResponse.json(
      { error: 'Invalid signature' }, 
      { status: 401 }
    );
  }

  const payload = JSON.parse(requestBody);
  const { event_type, session_id, user_id, status } = payload;

  console.log('📋 Webhook payload:', { event_type, session_id, user_id, status });

  // 2. Validar evento relevante
  if (event_type !== 'verification.status_update') {
    console.log('⚠️ Unsupported event type:', event_type);
    return NextResponse.json(
      { error: 'Unsupported event type' }, 
      { status: 400 }
    );
  }

  try {
    // 3. Verificar estado con API de Didit (doble verificación)
    const verificationData = await verifyWithDiditAPI(session_id);
    
    // 4. Actualizar Supabase con mejor manejo de errores
    const updateResult = await updateUserVerification(session_id, user_id, status, verificationData);
    
    // 5. Logging para auditoría
    await logWebhookEvent(payload, updateResult);

    console.log('✅ Successfully processed webhook:', { session_id, status });
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ========================================
// FUNCIONES MODULARES
// ========================================

// Función auxiliar para verificar firma HMAC
function verifyDiditSignature(payload, signature) {
  if (!signature) {
    console.error('❌ No signature provided');
    return false;
  }
  
  const secret = process.env.WEBHOOK_SECRET_KEY;
  if (!secret) {
    console.error('❌ WEBHOOK_SECRET_KEY not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    const isValid = signature === digest;
    
    if (!isValid) {
      console.error('❌ Signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
}

// Verificar estado con API de Didit
async function verifyWithDiditAPI(sessionId) {
  try {
    const apiKey = process.env.API_KEY || 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
    const response = await fetch(
      `https://api.didit.me/v1/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('🔍 Didit API verification data:', data);
      return data;
    } else {
      console.warn('⚠️ Didit API verification failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error calling Didit API:', error);
    return null;
  }
}

// Actualizar verificación del usuario en Supabase
async function updateUserVerification(sessionId, userId, status, verificationData) {
  try {
    const updateData = {
      verification_status: status,
      verification_data: verificationData,
      didit_session_id: sessionId,
      didit_verified: status === 'approved' || status === 'verified',
      updated_at: new Date().toISOString()
    };

    console.log('📝 Updating user verification:', { sessionId, userId, status });

    // Intentar actualizar por session_id primero
    let { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('didit_session_id', sessionId)
      .select();

    // Si no se encontró por session_id, intentar por user_id
    if (error || !data || data.length === 0) {
      console.log('🔄 Trying to update by user_id:', userId);
      ({ data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select());
    }

    if (error) {
      console.error('❌ Supabase update error:', error);
      throw error;
    }

    console.log('✅ User verification updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error updating user verification:', error);
    throw error;
  }
}

// Logging para auditoría
async function logWebhookEvent(payload, updateResult) {
  try {
    const logData = {
      event_type: 'didit_webhook',
      session_id: payload.session_id,
      user_id: payload.user_id,
      status: payload.status,
      timestamp: new Date().toISOString(),
      update_result: updateResult,
      payload: payload
    };

    // Intentar guardar en tabla de logs (opcional)
    await supabase
      .from('webhook_logs')
      .insert(logData)
      .catch(error => {
        console.warn('⚠️ Could not save webhook log:', error);
      });

    console.log('📊 Webhook event logged:', logData);
  } catch (error) {
    console.error('❌ Error logging webhook event:', error);
  }
} 