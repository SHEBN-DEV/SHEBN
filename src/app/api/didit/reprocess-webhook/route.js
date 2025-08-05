import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    console.log('🔄 Reprocessing webhook for session:', session_id);

    // Get webhook data from logs
    const { data: webhookLogs, error: logError } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (logError || !webhookLogs || webhookLogs.length === 0) {
      console.log('❌ No webhook logs found for session:', session_id);
      return NextResponse.json({
        success: false,
        error: 'No webhook logs found for this session'
      }, { status: 404 });
    }

    const webhookData = webhookLogs[0].webhook_data;
    console.log('📋 Found webhook data:', {
      session_id: webhookData.session_id,
      status: webhookData.status
    });

    // Check if verification already exists
    const { data: existingVerification } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('provider_verification_id', session_id)
      .single();

    if (existingVerification) {
      console.log('✅ Verification already exists for session:', session_id);
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Verification already processed',
        session_id: session_id,
        status: 'approved'
      });
    }

    // Process the webhook data
    if (webhookData.status === 'Approved' && webhookData.decision?.id_verification) {
      console.log('🎉 Reprocessing approved verification webhook');
      
      try {
        // Extract verification data
        const idVerification = webhookData.decision.id_verification;
        
        console.log('🔍 Extracted verification data:', {
          session_id: session_id,
          first_name: idVerification.first_name,
          last_name: idVerification.last_name,
          gender: idVerification.gender,
          document_number: idVerification.document_number,
          date_of_birth: idVerification.date_of_birth
        });

        // Store verification data using the correct table structure
        const verificationRecord = {
          user_id: null, // Will be linked when user completes registration
          verification_provider: 'didit',
          status: 'approved',
          provider_verification_id: session_id,
          verification_data: {
            session_id: session_id,
            status: webhookData.status,
            workflow_id: webhookData.workflow_id,
            personal_info: {
              first_name: idVerification.first_name,
              last_name: idVerification.last_name,
              gender: idVerification.gender,
              date_of_birth: idVerification.date_of_birth
            },
            document_info: {
              document_number: idVerification.document_number,
              date_of_issue: idVerification.date_of_issue,
              issuing_state: idVerification.issuing_state,
              document_type: idVerification.document_type
            },
            decision: webhookData.decision,
            raw_payload: webhookData
          }
        };

        console.log('💾 Storing verification record:', verificationRecord);

        // Insert verification record
        const { data, error } = await supabase
          .from('user_verifications')
          .insert(verificationRecord)
          .select();

        if (error) {
          console.error('❌ Error storing verification:', error);
          return NextResponse.json({
            success: false,
            error: 'Failed to store verification data'
          }, { status: 500 });
        }

        console.log('✅ Verification stored successfully:', data);

        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Verification reprocessed successfully',
          session_id: session_id,
          status: 'approved',
          data: {
            first_name: idVerification.first_name,
            last_name: idVerification.last_name,
            gender: idVerification.gender,
            document_number: idVerification.document_number
          }
        });

      } catch (error) {
        console.error('❌ Error reprocessing verification:', error);
        return NextResponse.json({
          success: false,
          verified: false,
          error: 'Failed to reprocess verification'
        }, { status: 500 });
      }
    } else {
      console.log('ℹ️ Webhook status not approved:', webhookData.status);
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Webhook status is not approved',
        status: webhookData.status
      });
    }

  } catch (error) {
    console.error('❌ Error reprocessing webhook:', error);
    return NextResponse.json({
      success: false,
      verified: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 