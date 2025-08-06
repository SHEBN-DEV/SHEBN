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
      console.log('✅ Webhook log stored');
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

        // 1. Check if verification_sessions record exists, if not create it
        let verificationSession = null;
        const { data: existingSession, error: sessionCheckError } = await supabase
          .from('verification_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (sessionCheckError && sessionCheckError.code === 'PGRST116') {
          // Session doesn't exist, create it
          console.log('📝 Creating new verification session');
          const { data: newSession, error: createError } = await supabase
            .from('verification_sessions')
            .insert({
              session_id: sessionId,
              status: 'APPROVED',
              verification_data: payload
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating verification session:', createError);
          } else {
            verificationSession = newSession;
            console.log('✅ Verification session created:', verificationSession);
          }
        } else if (sessionCheckError) {
          console.error('❌ Error checking verification session:', sessionCheckError);
        } else {
          // Session exists, update it
          console.log('📝 Updating existing verification session');
          const { data: updatedSession, error: updateError } = await supabase
            .from('verification_sessions')
            .update({
              status: 'APPROVED',
              verification_data: payload
            })
            .eq('session_id', sessionId)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating verification session:', updateError);
          } else {
            verificationSession = updatedSession;
            console.log('✅ Verification session updated:', verificationSession);
          }
        }

        // 2. Update or create user_verifications record
        const { data: existingVerification, error: verificationCheckError } = await supabase
          .from('user_verifications')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (verificationCheckError && verificationCheckError.code === 'PGRST116') {
          // Verification doesn't exist, create it
          console.log('📝 Creating new user verification');
          const { data: newVerification, error: createError } = await supabase
            .from('user_verifications')
            .insert({
              session_id: sessionId,
              status: 'approved',
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
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating user verification:', createError);
          } else {
            console.log('✅ User verification created:', newVerification);
          }
        } else if (verificationCheckError) {
          console.error('❌ Error checking user verification:', verificationCheckError);
        } else {
          // Verification exists, update it
          console.log('📝 Updating existing user verification');
          const { data: updatedVerification, error: updateError } = await supabase
            .from('user_verifications')
            .update({
              status: 'approved',
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
            })
            .eq('session_id', sessionId)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating user verification:', updateError);
          } else {
            console.log('✅ User verification updated:', updatedVerification);
          }
        }

        // 3. If user_id exists in verification session, update profile
        if (verificationSession?.user_id) {
          console.log('👤 Updating user profile:', verificationSession.user_id);
          const { data: profileUpdate, error: profileError } = await supabase
            .from('profiles')
            .update({
              is_verified: true,
              verification_status: 'approved',
              date_of_birth: idVerification.date_of_birth,
              document_expires_at: idVerification.expiration_date,
              didit_verified: true,
              didit_session_id: sessionId,
              didit_verification_data: payload
            })
            .eq('id', verificationSession.user_id)
            .select()
            .single();

          if (profileError) {
            console.error('❌ Error updating profile:', profileError);
          } else {
            console.log('✅ Profile updated:', profileUpdate);
          }
        } else {
          console.log('ℹ️ No user_id found in verification session, skipping profile update');
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
      
      // Create initial verification session if it doesn't exist
      const { data: existingSession, error: sessionCheckError } = await supabase
        .from('verification_sessions')
        .select('*')
        .eq('session_id', payload.session_id)
        .single();

      if (sessionCheckError && sessionCheckError.code === 'PGRST116') {
        // Session doesn't exist, create it
        const sessionRecord = {
          session_id: payload.session_id,
          status: 'NOT_STARTED',
          verification_data: {
            session_id: payload.session_id,
            status: payload.status,
            workflow_id: payload.workflow_id,
            created_at: payload.created_at
          }
        };

        const { error: sessionError } = await supabase
          .from('verification_sessions')
          .insert(sessionRecord);

        if (sessionError) {
          console.error('❌ Error creating verification session:', sessionError);
        } else {
          console.log('✅ Verification session created');
        }
      } else if (sessionCheckError) {
        console.error('❌ Error checking verification session:', sessionCheckError);
      } else {
        console.log('ℹ️ Verification session already exists');
      }

      // Create initial user verification record if it doesn't exist
      const { data: existingVerification, error: verificationCheckError } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('session_id', payload.session_id)
        .single();

      if (verificationCheckError && verificationCheckError.code === 'PGRST116') {
        // Verification doesn't exist, create it
        const verificationRecord = {
          session_id: payload.session_id,
          status: 'pending',
          verification_data: {
            session_id: payload.session_id,
            status: payload.status,
            workflow_id: payload.workflow_id,
            created_at: payload.created_at
          }
        };

        const { error: verificationError } = await supabase
          .from('user_verifications')
          .insert(verificationRecord);

        if (verificationError) {
          console.error('❌ Error creating user verification:', verificationError);
        } else {
          console.log('✅ User verification created');
        }
      } else if (verificationCheckError) {
        console.error('❌ Error checking user verification:', verificationCheckError);
      } else {
        console.log('ℹ️ User verification already exists');
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