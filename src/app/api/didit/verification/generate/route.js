import { didit } from '../../../../lib/didit/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, metadata } = await request.json();
    
    const sessionData = await didit.createSession({
      userId,
      email: metadata.email,
      metadata,
      callbackUrl: 'https://shebn.vercel.app/api/didit/webhook'
    });
    
    return NextResponse.json({ 
      verification_url: sessionData.verification_url,
      session_id: sessionData.session_id,
      status: sessionData.status
    });
  } catch (error) {
    console.error('❌ Error in verification generation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}