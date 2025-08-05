import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST() {
  try {
    console.log('🔧 Setting up database tables...');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing database credentials'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // SQL script to create tables
    const sqlScript = `
      -- Create user_verifications table for Didit verification data
      CREATE TABLE IF NOT EXISTS user_verifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          verification_provider TEXT NOT NULL DEFAULT 'didit',
          status TEXT NOT NULL DEFAULT 'pending',
          provider_verification_id TEXT UNIQUE NOT NULL,
          verification_data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_verifications_provider_id ON user_verifications(provider_verification_id);
      CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
      CREATE INDEX IF NOT EXISTS idx_user_verifications_provider ON user_verifications(verification_provider);

      -- Create webhook_logs table for debugging
      CREATE TABLE IF NOT EXISTS webhook_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          session_id TEXT NOT NULL,
          status TEXT NOT NULL,
          webhook_data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for webhook logs
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_session_id ON webhook_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

      -- Enable Row Level Security (RLS)
      ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

      -- Create policies for user_verifications
      DROP POLICY IF EXISTS "Users can view their own verifications" ON user_verifications;
      CREATE POLICY "Users can view their own verifications" ON user_verifications
          FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Service role can manage all verifications" ON user_verifications;
      CREATE POLICY "Service role can manage all verifications" ON user_verifications
          FOR ALL USING (auth.role() = 'service_role');

      -- Create policies for webhook_logs
      DROP POLICY IF EXISTS "Service role can manage all webhook logs" ON webhook_logs;
      CREATE POLICY "Service role can manage all webhook logs" ON webhook_logs
          FOR ALL USING (auth.role() = 'service_role');

      -- Grant permissions to authenticated users
      GRANT SELECT ON user_verifications TO authenticated;
      GRANT INSERT, UPDATE ON user_verifications TO service_role;
      GRANT ALL ON webhook_logs TO service_role;

      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for updated_at
      DROP TRIGGER IF EXISTS update_user_verifications_updated_at ON user_verifications;
      CREATE TRIGGER update_user_verifications_updated_at 
          BEFORE UPDATE ON user_verifications 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('📝 Executing SQL script...');

    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative approach...');
      
      const statements = [
        'CREATE TABLE IF NOT EXISTS user_verifications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, verification_provider TEXT NOT NULL DEFAULT \'didit\', status TEXT NOT NULL DEFAULT \'pending\', provider_verification_id TEXT UNIQUE NOT NULL, verification_data JSONB NOT NULL DEFAULT \'{}\', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())',
        'CREATE TABLE IF NOT EXISTS webhook_logs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, session_id TEXT NOT NULL, status TEXT NOT NULL, webhook_data JSONB NOT NULL DEFAULT \'{}\', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())'
      ];

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.error('❌ Statement failed:', stmtError);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (stmtError) {
          console.error('❌ Statement error:', stmtError);
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to execute SQL script',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Tables created successfully');

    // Test the tables
    const { data: testData, error: testError } = await supabase
      .from('user_verifications')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Table test failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Tables created but test failed',
        details: testError
      }, { status: 500 });
    }

    console.log('✅ Table test successful');

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      tables: ['user_verifications', 'webhook_logs']
    });

  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 