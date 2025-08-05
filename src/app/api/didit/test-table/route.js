import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('🔍 Testing user_verifications table...');

    // Test 1: Check if table exists by trying to select from it
    const { data: tableTest, error: tableError } = await supabase
      .from('user_verifications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table test failed:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Table test failed',
        details: tableError
      }, { status: 500 });
    }

    console.log('✅ Table exists, structure:', tableTest);

    // Test 2: Try to insert a simple record
    const testRecord = {
      user_id: null,
      verification_provider: 'test',
      status: 'test',
      provider_verification_id: 'test-session-' + Date.now(),
      verification_data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('💾 Testing insert with record:', testRecord);

    const { data: insertTest, error: insertError } = await supabase
      .from('user_verifications')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: insertError
      }, { status: 500 });
    }

    console.log('✅ Insert test successful:', insertTest);

    // Test 3: Clean up test record
    const { error: deleteError } = await supabase
      .from('user_verifications')
      .delete()
      .eq('provider_verification_id', testRecord.provider_verification_id);

    if (deleteError) {
      console.error('⚠️ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test record cleaned up');
    }

    return NextResponse.json({
      success: true,
      message: 'Table test successful',
      table_exists: true,
      insert_works: true,
      test_record: testRecord
    });

  } catch (error) {
    console.error('❌ Error testing table:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 