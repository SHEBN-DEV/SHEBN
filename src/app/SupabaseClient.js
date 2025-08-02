import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://fcvhshxkatnrzrsvbnpo.supabase.co';
const supabaseAnonKey  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdmhzaHhrYXRucnpyc3ZibnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MjM5ODMsImV4cCI6MjA2ODA5OTk4M30.rgC8VIle34eyCWZkEIVGREFeebRJYxtJhBDfmxlIJVY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);