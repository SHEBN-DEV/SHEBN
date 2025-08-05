import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('🧪 Testing manual insertion into user_verifications table');
    
    // Datos de prueba basados en el webhook real
    const testVerificationRecord = {
      user_id: null, // Sin user_id por ahora
      didit_session_id: 'test-session-' + Date.now(),
      status: 'approved',
      first_name: 'Lina Maria',
      last_name: 'Giraldo Tapiero',
      document_number: '1081410492',
      date_of_birth: '1992-07-20',
      date_of_issue: '2010-09-08',
      gender: 'F',
      issuing_state: 'COL',
      document_type: 'Identity Card',
      raw_didit_data: {
        test: true,
        session_id: 'test-session-' + Date.now(),
        status: 'Approved'
      }
    };
    
    console.log('💾 Attempting to insert test record:', testVerificationRecord);
    
    // Intentar insertar en Supabase
    const { data, error } = await supabase
      .from('user_verifications')
      .insert(testVerificationRecord)
      .select();

    if (error) {
      console.error('❌ Error inserting test record:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        test_record: testVerificationRecord
      }, { status: 500 });
    } else {
      console.log('✅ Test record inserted successfully:', data);
      return NextResponse.json({
        success: true,
        message: 'Test record inserted successfully',
        data: data,
        test_record: testVerificationRecord
      });
    }

  } catch (error) {
    console.error('❌ Error in test insert:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 