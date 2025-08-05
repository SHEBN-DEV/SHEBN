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
CREATE POLICY "Users can view their own verifications" ON user_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all verifications" ON user_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for webhook_logs
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
CREATE TRIGGER update_user_verifications_updated_at 
    BEFORE UPDATE ON user_verifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 