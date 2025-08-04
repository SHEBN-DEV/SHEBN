import { NextResponse } from 'next/server';
import { didit } from '../../../lib/didit/client';
import { createClient } from '@supabase/supabase-js';
import { DIDIT_CONFIG } from '../../../lib/didit/constants';

// Use service role key for secure database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const signature = request.headers.get('x-didit-signature');
    const payload = await request.json();

    console.log('📥 Verification callback received:', {
      has_signature: !!signature,
      event_type: payload.event,
      session_id: payload.session_id,
      timestamp: new Date().toISOString()
    });

    // Verify webhook signature for security
    if (!didit.verifyWebhook(signature, payload)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process the verification data
    const processedData = didit.processWebhook(payload);
    
    console.log('✅ Verification data processed:', {
      session_id: processedData.session_id,
      status: processedData.status,
      verified: processedData.verified,
      has_user_data: !!processedData.user_data
    });

    // Extract gender from verification data
    const gender = didit.extractGender(processedData);
    console.log('👤 Gender extracted:', gender);

    // Store verification data in database
    try {
      const { data: verificationRecord, error: dbError } = await supabase
        .from('user_verifications')
        .insert({
          verification_provider: 'didit',
          status: processedData.status,
          session_id: processedData.session_id,
          verification_data: {
            ...processedData,
            gender: gender,
            extracted_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error storing verification data:', dbError);
        return NextResponse.json({ 
          error: 'Database error',
          details: dbError.message 
        }, { status: 500 });
      }

      console.log('✅ Verification data stored in database:', verificationRecord);

      // Log webhook for debugging
      await supabase
        .from('webhook_logs')
        .insert({
          session_id: processedData.session_id,
          webhook_data: payload,
          status: processedData.status
        });

    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      session_id: processedData.session_id,
      status: processedData.status,
      gender: gender,
      verified: processedData.verified
    });

  } catch (error) {
    console.error('❌ Error processing verification callback:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const email = searchParams.get('email');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 });
    }

    console.log('🔍 Checking verification status for session:', sessionId);

    // Get verification status from database
    const { data: verificationData, error: dbError } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('session_id', sessionId)
      .eq('verification_provider', 'didit')
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError.message 
      }, { status: 500 });
    }

    if (!verificationData) {
      console.log('⚠️ No verification data found for session:', sessionId);
      return NextResponse.json({ 
        verified: false,
        status: 'not_found',
        session_id: sessionId
      });
    }

    // Extract gender from stored verification data
    const gender = didit.extractGender(verificationData.verification_data);
    
    console.log('✅ Verification status retrieved:', {
      session_id: sessionId,
      status: verificationData.status,
      gender: gender,
      verified: verificationData.status === 'approved'
    });

    return NextResponse.json({
      verified: verificationData.status === 'approved',
      session_id: sessionId,
      status: verificationData.status,
      gender: gender,
      verification_data: verificationData.verification_data
    });

  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 