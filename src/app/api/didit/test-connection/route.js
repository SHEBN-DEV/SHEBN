import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...');
    console.log('🔑 Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('🔑 Supabase Key:', supabaseKey ? 'Present' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test simple query to user_verifications table
    const { data, error } = await supabase
      .from('user_verifications')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log('✅ Supabase connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: data,
      tableAccess: 'user_verifications accessible'
    });
    
  } catch (error) {
    console.error('❌ Error in test-connection:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 