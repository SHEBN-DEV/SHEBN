import { NextResponse } from 'next/server';
import { didit } from '../../../lib/didit/client';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const signature = request.headers.get('x-didit-signature');
    const payload = await request.json();

    console.log('📥 Webhook received:', {
      has_signature: !!signature,
      event_type: payload.event,
      session_id: payload.session_id,
      timestamp: new Date().toISOString()
    });

    // Verify webhook signature
    if (!didit.verifyWebhook(signature, payload)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process webhook data
    const processedData = didit.processWebhook(payload);
    
    console.log('✅ Webhook processed:', {
      session_id: processedData.session_id,
      status: processedData.status,
      verified: processedData.verified
    });

    // Store webhook log
    try {
      const { data: logData, error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          session_id: processedData.session_id,
          webhook_data: payload,
          status: processedData.status
        });

      if (logError) {
        console.warn('⚠️ Error storing webhook log:', logError);
      } else {
        console.log('✅ Webhook log stored:', logData);
      }
    } catch (dbError) {
      console.warn('⚠️ Error with database operation:', dbError);
    }

    // Process events based on type
    switch (payload.event) {
      case 'verification.completed':
      case 'verification.approved':
        await handleVerificationCompleted(processedData);
        break;
        
      case 'verification.declined':
      case 'verification.failed':
        await handleVerificationDeclined(processedData);
        break;
        
      case 'session.created':
        await handleSessionCreated(processedData);
        break;
        
      case 'session.updated':
        await handleSessionUpdated(processedData);
        break;
        
      default:
        console.log('ℹ️ Unhandled webhook event:', payload.event);
    }

    return NextResponse.json({ 
      success: true,
      processed: true,
      session_id: processedData.session_id
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

async function handleVerificationCompleted(verificationData) {
  try {
    console.log('🎉 Handling verification completed:', verificationData.session_id);
    
    // Extraer datos del payload de Didit
    const extractedData = verificationData.extracted_data || {};
    const metadata = verificationData.metadata || {};
    
    // Extraer género - buscar en múltiples ubicaciones posibles
    let gender = null;
    if (extractedData.gender) {
      gender = extractedData.gender;
    } else if (metadata.gender) {
      gender = metadata.gender;
    } else if (verificationData.raw_data?.document_data?.gender) {
      gender = verificationData.raw_data.document_data.gender;
    } else if (verificationData.document_data?.gender) {
      gender = verificationData.document_data.gender;
    }
    
    console.log('🔍 Gender extracted:', gender);
    console.log('📋 Extracted data:', extractedData);
    
    // Extraer user_id del metadata
    const userId = metadata.user_id;
    
    // Preparar datos para Supabase
    const verificationRecord = {
      user_id: userId,
      didit_session_id: verificationData.session_id,
      status: 'approved',
      first_name: extractedData.first_name,
      last_name: extractedData.last_name,
      document_number: extractedData.document_number,
      date_of_birth: extractedData.date_of_birth ? new Date(extractedData.date_of_birth) : null,
      date_of_issue: extractedData.date_of_issue ? new Date(extractedData.date_of_issue) : null,
      gender: gender,
      issuing_state: extractedData.issuing_state,
      document_type: extractedData.document_type,
      raw_didit_data: verificationData
    };
    
    console.log('💾 Saving verification record:', verificationRecord);
    
    // Guardar en Supabase usando upsert para evitar duplicados
    const { data, error } = await supabase
      .from('user_verifications')
      .upsert(verificationRecord, { 
        onConflict: 'didit_session_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Error storing verification:', error);
    } else {
      console.log('✅ Verification stored successfully:', data);
      
      // Actualizar el perfil del usuario si existe
      if (userId) {
        await updateUserProfile(userId, {
          is_verified: true,
          gender: gender,
          verification_status: 'approved'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in handleVerificationCompleted:', error);
  }
}

async function handleVerificationDeclined(verificationData) {
  try {
    console.log('❌ Handling verification declined:', verificationData.session_id);
    
    // Store declined verification
    const { data, error } = await supabase
      .from('user_verifications')
      .insert({
        verification_provider: 'didit',
        status: 'declined',
        session_id: verificationData.session_id,
        verification_data: verificationData
      });

    if (error) {
      console.error('❌ Error storing declined verification:', error);
    } else {
      console.log('✅ Declined verification stored:', data);
    }
  } catch (error) {
    console.error('❌ Error in handleVerificationDeclined:', error);
  }
}

async function handleSessionCreated(sessionData) {
  try {
    console.log('📝 Handling session created:', sessionData.session_id);
    
    // Store session creation
    const { data, error } = await supabase
      .from('user_verifications')
      .insert({
        verification_provider: 'didit',
        status: 'pending',
        session_id: sessionData.session_id,
        verification_data: sessionData
      });

    if (error) {
      console.error('❌ Error storing session creation:', error);
    } else {
      console.log('✅ Session creation stored:', data);
    }
  } catch (error) {
    console.error('❌ Error in handleSessionCreated:', error);
  }
}

async function handleSessionUpdated(sessionData) {
  try {
    console.log('🔄 Handling session updated:', sessionData.session_id);
    
    // Update existing session
    const { data, error } = await supabase
      .from('user_verifications')
      .update({
        status: sessionData.status,
        verification_data: sessionData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionData.session_id);

    if (error) {
      console.error('❌ Error updating session:', error);
    } else {
      console.log('✅ Session updated:', data);
    }
  } catch (error) {
    console.error('❌ Error in handleSessionUpdated:', error);
  }
}

// Función para actualizar el perfil del usuario
async function updateUserProfile(userId, profileData) {
  try {
    console.log('👤 Updating user profile:', userId, profileData);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating user profile:', error);
    } else {
      console.log('✅ User profile updated successfully:', data);
    }
  } catch (error) {
    console.error('❌ Error in updateUserProfile:', error);
  }
}