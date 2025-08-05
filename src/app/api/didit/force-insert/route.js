import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('🧪 Force inserting verification data from webhook');
    
    // Datos exactos del webhook que acabamos de recibir
    const verificationRecord = {
      user_id: null, // Sin user_id por ahora
      didit_session_id: 'd88ceb7e-fee4-4fc8-a163-05af46510f96',
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
        session_id: 'd88ceb7e-fee4-4fc8-a163-05af46510f96',
        status: 'Approved',
        workflow_id: 'cf449f7e-1848-4e21-a9b4-084000bfdc26',
        decision: {
          id_verification: {
            gender: 'F',
            first_name: 'Lina Maria',
            last_name: 'Giraldo Tapiero',
            document_number: '1081410492',
            date_of_birth: '1992-07-20',
            date_of_issue: '2010-09-08',
            issuing_state: 'COL',
            document_type: 'Identity Card'
          }
        }
      }
    };
    
    console.log('💾 Inserting verification record:', verificationRecord);
    
    // Insertar en Supabase
    const { data, error } = await supabase
      .from('user_verifications')
      .insert(verificationRecord)
      .select();
    
    if (error) {
      console.error('❌ Error inserting verification:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log('✅ Verification inserted successfully:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Verification data inserted successfully',
      data: data[0],
      session_id: 'd88ceb7e-fee4-4fc8-a163-05af46510f96'
    });
    
  } catch (error) {
    console.error('❌ Error in force-insert:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 