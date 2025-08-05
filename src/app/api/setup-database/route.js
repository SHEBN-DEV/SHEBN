import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for database setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    console.log('🗄️ Setting up database with updated schema...');

    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFilePath = path.join(process.cwd(), 'database-complete-setup.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json({
        success: false,
        error: 'SQL file not found'
      }, { status: 404 });
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          results.push({
            statement: i + 1,
            success: false,
            error: error.message
          });
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          results.push({
            statement: i + 1,
            success: true
          });
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err);
        results.push({
          statement: i + 1,
          success: false,
          error: err.message
        });
        errorCount++;
      }
    }

    console.log(`🎉 Database setup completed: ${successCount} successful, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      summary: {
        total_statements: statements.length,
        successful: successCount,
        errors: errorCount
      },
      results: results
    });

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup database'
    }, { status: 500 });
  }
} 