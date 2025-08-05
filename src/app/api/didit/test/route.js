import { didit } from '../../../lib/didit/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Didit integration with workflow:', didit.workflowId);
    
    const sessionData = await didit.createSession({
      userId: 'test_user_123',
      email: 'test@shebn.com',
      metadata: {
        name: 'Test User',
        gender: 'female',
        platform: 'shebn',
        test_mode: true
      },
      callbackUrl: 'https://shebn.vercel.app/api/didit/webhook'
    });

    console.log('✅ Test session created:', sessionData);

    return NextResponse.json({
      success: true,
      session_data: sessionData,
      config: {
        apiKey: didit.apiKey ? 'Present' : 'Missing',
        workflowId: didit.workflowId,
        url: 'https://verification.didit.me/v2/session/'
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        apiKey: didit.apiKey ? 'Present' : 'Missing',
        workflowId: didit.workflowId
      }
    }, { status: 500 });
  }
} 