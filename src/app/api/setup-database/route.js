import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for database setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    console.log('🗄️ Setting up database with updated schema...');

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // 1. Test if verification_sessions table exists by trying to insert a test record
    try {
      const { data, error } = await supabase
        .from('verification_sessions')
        .insert({
          session_id: 'test-setup-' + Date.now(),
          status: 'NOT_STARTED',
          verification_data: { test: true }
        })
        .select();

      if (error && error.message.includes('does not exist')) {
        console.log('❌ verification_sessions table does not exist - needs manual creation');
        results.push({
          operation: 'check_verification_sessions_table',
          success: false,
          error: 'Table does not exist - needs manual creation in Supabase dashboard',
          action_required: 'Create table manually in Supabase SQL editor'
        });
        errorCount++;
      } else if (error) {
        console.error('❌ Error testing verification_sessions table:', error);
        results.push({
          operation: 'check_verification_sessions_table',
          success: false,
          error: error.message
        });
        errorCount++;
      } else {
        console.log('✅ verification_sessions table exists and is accessible');
        results.push({
          operation: 'check_verification_sessions_table',
          success: true
        });
        successCount++;

        // Clean up test record
        await supabase
          .from('verification_sessions')
          .delete()
          .eq('session_id', data[0].session_id);
      }
    } catch (err) {
      console.error('❌ Exception testing verification_sessions table:', err);
      results.push({
        operation: 'check_verification_sessions_table',
        success: false,
        error: err.message
      });
      errorCount++;
    }

    // 2. Test if profiles table has new columns
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_verified, date_of_birth, document_expires_at')
        .limit(1);

      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Profiles table missing new columns - needs manual update');
        results.push({
          operation: 'check_profiles_new_columns',
          success: false,
          error: 'Missing new columns - needs manual update in Supabase dashboard',
          action_required: 'Add columns manually in Supabase SQL editor'
        });
        errorCount++;
      } else if (error) {
        console.error('❌ Error testing profiles table columns:', error);
        results.push({
          operation: 'check_profiles_new_columns',
          success: false,
          error: error.message
        });
        errorCount++;
      } else {
        console.log('✅ Profiles table has new columns');
        results.push({
          operation: 'check_profiles_new_columns',
          success: true
        });
        successCount++;
      }
    } catch (err) {
      console.error('❌ Exception testing profiles table columns:', err);
      results.push({
        operation: 'check_profiles_new_columns',
        success: false,
        error: err.message
      });
      errorCount++;
    }

    // 3. Test webhook_logs table
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Error testing webhook_logs table:', error);
        results.push({
          operation: 'check_webhook_logs_table',
          success: false,
          error: error.message
        });
        errorCount++;
      } else {
        console.log('✅ webhook_logs table is accessible');
        results.push({
          operation: 'check_webhook_logs_table',
          success: true,
          row_count: data ? data.length : 0
        });
        successCount++;
      }
    } catch (err) {
      console.error('❌ Exception testing webhook_logs table:', err);
      results.push({
        operation: 'check_webhook_logs_table',
        success: false,
        error: err.message
      });
      errorCount++;
    }

    // 4. Test user_verifications table
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Error testing user_verifications table:', error);
        results.push({
          operation: 'check_user_verifications_table',
          success: false,
          error: error.message
        });
        errorCount++;
      } else {
        console.log('✅ user_verifications table is accessible');
        results.push({
          operation: 'check_user_verifications_table',
          success: true,
          row_count: data ? data.length : 0
        });
        successCount++;
      }
    } catch (err) {
      console.error('❌ Exception testing user_verifications table:', err);
      results.push({
        operation: 'check_user_verifications_table',
        success: false,
        error: err.message
      });
      errorCount++;
    }

    console.log(`🎉 Database check completed: ${successCount} successful, ${errorCount} errors`);

    // Determine if manual action is needed
    const needsManualAction = results.some(r => r.action_required);

    return NextResponse.json({
      success: !needsManualAction,
      message: needsManualAction ? 'Database needs manual setup' : 'Database setup completed',
      summary: {
        total_operations: results.length,
        successful: successCount,
        errors: errorCount,
        needs_manual_action: needsManualAction
      },
      results: results,
      next_steps: needsManualAction ? [
        '1. Go to Supabase Dashboard > SQL Editor',
        '2. Execute the database-complete-setup.sql script',
        '3. Run this endpoint again to verify setup'
      ] : [
        'Database is ready for Didit integration!'
      ]
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database status'
    }, { status: 500 });
  }
} 