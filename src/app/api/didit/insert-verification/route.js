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

    console.log('🔧 Manually inserting verification for session:', session_id);

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
        message: 'Verification already exists',
        session_id: session_id,
        status: 'approved'
      });
    }

    // Manual verification data based on the webhook we received
    const verificationRecord = {
      user_id: null, // Will be linked when user completes registration
      verification_provider: 'didit',
      status: 'approved',
      provider_verification_id: session_id,
      verification_data: {
        session_id: session_id,
        status: 'Approved',
        workflow_id: 'cf449f7e-1848-4e21-a9b4-084000bfdc26',
        personal_info: {
          first_name: 'Lina Maria',
          last_name: 'Giraldo Tapiero',
          gender: 'F',
          date_of_birth: '1992-07-20'
        },
        document_info: {
          document_number: '1081410492',
          date_of_issue: '2010-09-08',
          issuing_state: 'COL',
          document_type: 'Identity Card'
        },
        decision: {
          status: 'Approved',
          features: ['ID_VERIFICATION', 'LIVENESS', 'FACE_MATCH'],
          id_verification: {
            status: 'Approved',
            first_name: 'Lina Maria',
            last_name: 'Giraldo Tapiero',
            gender: 'F',
            document_number: '1081410492',
            date_of_birth: '1992-07-20'
          },
          face_match: {
            status: 'Approved',
            score: 93.4
          },
          liveness: {
            status: 'Approved',
            score: 91.8
          }
        }
      }
    };

    console.log('💾 Inserting verification record:', verificationRecord);

    // Insert verification record
    const { data, error } = await supabase
      .from('user_verifications')
      .insert(verificationRecord)
      .select();

    if (error) {
      console.error('❌ Error inserting verification:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert verification data',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Verification inserted successfully:', data);

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Verification inserted successfully',
      session_id: session_id,
      status: 'approved',
      data: {
        first_name: 'Lina Maria',
        last_name: 'Giraldo Tapiero',
        gender: 'F',
        document_number: '1081410492'
      }
    });

  } catch (error) {
    console.error('❌ Error inserting verification:', error);
    return NextResponse.json({
      success: false,
      verified: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 