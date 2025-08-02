import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('user_id');

  if (!status || !userId) {
    return NextResponse.redirect(new URL('/auth/verification/status?error=missing_params', request.url));
  }

  await supabase
    .from('user_verifications')
    .upsert({
      user_id: userId,
      status,
      updated_at: new Date().toISOString()
    });

  return NextResponse.redirect(new URL(`/auth/verification/status?status=${status}`, request.url));
}