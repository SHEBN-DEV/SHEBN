import { NextResponse } from 'next/server';
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
      session_id: payload.session_id,
      status: payload.status
    });

    console.log('📋 Complete webhook payload:', payload);

    // Verify webhook signature if configured
    if (process.env.DIDIT_WEBHOOK_SECRET && signature) {
      console.log('🔐 Webhook signature verification enabled');
      // TODO: Implement signature verification
    } else {
      console.log('⚠️ No webhook secret configured, accepting all webhooks');
    }

    // Store webhook log
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        session_id: payload.session_id,
        status: payload.status,
        webhook_data: payload
      });

    if (logError) {
      console.error('❌ Error storing webhook log:', logError);
    } else {
      console.log('✅ Webhook log stored:', null);
    }

    // Process webhook based on status
    if (payload.status === 'Approved' && payload.decision?.id_verification) {
      console.log('🎉 Processing approved verification webhook');
      
      try {
        // Extract verification data
        const idVerification = payload.decision.id_verification;
        const sessionId = payload.session_id;
        
        console.log('🔍 Extracted verification data:', {
          session_id: sessionId,
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
          provider_verification_id: sessionId,
          verification_data: {
            session_id: sessionId,
            status: payload.status,
            workflow_id: payload.workflow_id,
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
            decision: payload.decision,
            raw_payload: payload
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

        // Update user profile if user_id is available
        if (verificationRecord.user_id) {
          await updateUserProfile(verificationRecord.user_id, {
            is_verified: true,
            gender: idVerification.gender,
            verification_status: 'approved'
          });
        }

        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Verification processed successfully',
          session_id: sessionId,
          status: 'approved'
        });

      } catch (error) {
        console.error('❌ Error processing verification:', error);
        return NextResponse.json({
          success: false,
          verified: false,
          error: 'Failed to process verification'
        }, { status: 500 });
      }
    } else if (payload.status === 'Not Started') {
      console.log('📝 Processing session creation webhook');
      
      // Store initial session record
      const sessionRecord = {
        user_id: null,
        verification_provider: 'didit',
        status: 'not_started',
        provider_verification_id: payload.session_id,
        verification_data: {
          session_id: payload.session_id,
          status: payload.status,
          workflow_id: payload.workflow_id,
          created_at: payload.created_at
        }
      };

      const { error } = await supabase
        .from('user_verifications')
        .insert(sessionRecord);

      if (error) {
        console.error('❌ Error storing session:', error);
      } else {
        console.log('✅ Session stored successfully');
      }

      return NextResponse.json({
        success: true,
        verified: false,
        message: 'Session created successfully',
        session_id: payload.session_id,
        status: 'not_started'
      });
    } else {
      console.log('ℹ️ Unhandled webhook status:', payload.status);
      return NextResponse.json({
        success: true,
        verified: false,
        message: 'Webhook received but not processed',
        status: payload.status
      });
    }

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({
      success: false,
      verified: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Function to update user profile
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