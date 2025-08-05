import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    console.log('🔍 Checking database connection...');
    console.log('URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Key:', supabaseKey ? 'Present' : 'Missing');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing database credentials',
        url_present: !!supabaseUrl,
        key_present: !!supabaseKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError
      }, { status: 500 });
    }

    console.log('✅ Database connection successful');

    // Try to access user_verifications table
    try {
      const { data: verificationsTest, error: verificationsError } = await supabase
        .from('user_verifications')
        .select('count')
        .limit(1);

      if (verificationsError) {
        console.error('❌ user_verifications table error:', verificationsError);
        return NextResponse.json({
          success: true,
          connection: 'OK',
          user_verifications_table: 'ERROR',
          error: verificationsError
        });
      }

      console.log('✅ user_verifications table accessible');
      return NextResponse.json({
        success: true,
        connection: 'OK',
        user_verifications_table: 'OK',
        message: 'Database and table are accessible'
      });

    } catch (tableError) {
      console.error('❌ Table access error:', tableError);
      return NextResponse.json({
        success: true,
        connection: 'OK',
        user_verifications_table: 'ERROR',
        error: tableError.message
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 