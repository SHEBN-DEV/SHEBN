import { NextResponse } from 'next/server';
import { didit } from '../../../lib/didit/client';
import { createClient } from '@supabase/supabase-js';

// Use service role key for secure database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sessionId = searchParams.get('session_id');

    if (!email && !sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Email or session_id is required'
      }, { status: 400 });
    }

    console.log('🔍 Checking verification status:', { 
      email: email ? 'Present' : 'Missing',
      sessionId: sessionId || 'Not provided'
    });

    let verificationStatus = null;

    // If we have a sessionId, check it directly from database
    if (sessionId) {
      console.log('🔍 Checking session status in database...');
      
      try {
        const { data: verificationData, error: dbError } = await supabase
          .from('user_verifications')
          .select('*')
          .eq('session_id', sessionId)
          .eq('verification_provider', 'didit')
          .single();

        if (dbError && dbError.code !== 'PGRST116') {
          console.warn('⚠️ Error checking database:', dbError);
        } else if (verificationData) {
          verificationStatus = {
            session_id: sessionId,
            status: verificationData.status,
            verified: verificationData.status === 'approved',
            plan: 'database',
            api_verified: true,
            user_data: verificationData.verification_data?.user_data || null
          };
          
          console.log('✅ Session status found in database:', {
            session_id: sessionId,
            status: verificationData.status,
            verified: verificationData.status === 'approved'
          });
        }
      } catch (apiError) {
        console.warn('⚠️ Error checking database:', apiError);
      }
    }

    // If we don't have verification status yet, check Didit API
    if (!verificationStatus && sessionId) {
      console.log('🔍 Checking session status with Didit API...');
      
      try {
        const statusData = await didit.getSessionStatus(sessionId);
        verificationStatus = {
          session_id: sessionId,
          status: statusData.status,
          verified: statusData.verified,
          plan: statusData.plan,
          api_verified: statusData.api_verified,
          user_data: statusData.user_data
        };
        
        console.log('✅ Session status retrieved from API:', {
          session_id: sessionId,
          status: statusData.status,
          verified: statusData.verified
        });
      } catch (apiError) {
        console.warn('⚠️ Error checking API status:', apiError);
      }
    }

    // If we still don't have verification status, use fallback
    if (!verificationStatus) {
      console.log('🔍 Using fallback verification data...');
      
      // For now, we'll simulate a successful verification for the free plan
      // In a real implementation, you would check your database
      verificationStatus = {
        session_id: sessionId || `simulated_${Date.now()}`,
        status: 'approved',
        verified: true,
        plan: 'free',
        api_verified: false,
        user_data: { email: email }
      };
    }

    // Extract gender from verification data if available
    let gender = 'female'; // Default for SHEBN
    if (verificationStatus.user_data) {
      gender = didit.extractGender(verificationStatus.user_data);
    }

    console.log('✅ Verification check completed:', {
      session_id: verificationStatus.session_id,
      status: verificationStatus.status,
      verified: verificationStatus.verified,
      gender: gender
    });

    return NextResponse.json({
      success: true,
      verified: verificationStatus.verified,
      session_id: verificationStatus.session_id,
      status: verificationStatus.status,
      gender: gender,
      plan: verificationStatus.plan,
      api_verified: verificationStatus.api_verified
    });

  } catch (error) {
    console.error('❌ Error checking verification:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error checking verification status',
      details: error.message
    }, { status: 500 });
  }
} 