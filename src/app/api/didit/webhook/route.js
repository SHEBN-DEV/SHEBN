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
    
    // Extract gender from verification data
    const gender = didit.extractGender(verificationData);
    
    // Store verification in database
    const { data, error } = await supabase
      .from('user_verifications')
      .insert({
        verification_provider: 'didit',
        status: 'approved',
        session_id: verificationData.session_id,
        verification_data: {
          ...verificationData,
          gender: gender,
          processed_at: new Date().toISOString()
        }
      });

    if (error) {
      console.error('❌ Error storing verification:', error);
    } else {
      console.log('✅ Verification stored successfully:', data);
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