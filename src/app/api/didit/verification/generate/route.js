import { didit } from '@/lib/dtdit/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, metadata } = await request.json();
    const { verification_url } = await didit.startVerification(userId, metadata);
    
    return NextResponse.json({ verification_url });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}