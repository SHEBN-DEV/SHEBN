import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for database checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('🔍 Checking database status...');

    const tables = [
      'profiles',
      'verification_sessions',
      'user_verifications',
      'projects',
      'project_applications',
      'user_connections',
      'webhook_logs'
    ];

    const results = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          results[table] = {
            exists: false,
            error: error.message
          };
        } else {
          results[table] = {
            exists: true,
            accessible: true,
            row_count: data ? data.length : 0
          };
        }
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        };
      }
    }

    // Check if verification_sessions table has the correct structure
    let verificationSessionsStructure = null;
    try {
      const { data, error } = await supabase
        .from('verification_sessions')
        .select('id, session_id, user_id, status, verification_data, created_at, updated_at')
        .limit(1);

      if (!error) {
        verificationSessionsStructure = {
          has_required_columns: true,
          columns: ['id', 'session_id', 'user_id', 'status', 'verification_data', 'created_at', 'updated_at']
        };
      }
    } catch (err) {
      verificationSessionsStructure = {
        has_required_columns: false,
        error: err.message
      };
    }

    // Check profiles table for new fields
    let profilesStructure = null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_name, email, gender, verification_status, is_verified, date_of_birth, document_expires_at, didit_verified, didit_session_id, didit_verification_data')
        .limit(1);

      if (!error) {
        profilesStructure = {
          has_required_columns: true,
          has_new_fields: true,
          new_fields: ['is_verified', 'date_of_birth', 'document_expires_at']
        };
      }
    } catch (err) {
      profilesStructure = {
        has_required_columns: false,
        error: err.message
      };
    }

    const summary = {
      total_tables: tables.length,
      existing_tables: Object.values(results).filter(r => r.exists).length,
      missing_tables: Object.values(results).filter(r => !r.exists).length,
      verification_sessions_ready: verificationSessionsStructure?.has_required_columns || false,
      profiles_updated: profilesStructure?.has_new_fields || false
    };

    console.log('✅ Database check completed:', summary);

    return NextResponse.json({
      success: true,
      message: 'Database status checked successfully',
      summary,
      tables: results,
      verification_sessions_structure: verificationSessionsStructure,
      profiles_structure: profilesStructure
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database status'
    }, { status: 500 });
  }
} 