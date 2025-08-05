import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Didit integration with workflow: 5uhSPBvSG');
    
    const apiKey = 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
    const workflowId = '5uhSPBvSG';
    
    const sessionId = `test_${Date.now()}`;
    
    const response = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        session_id: sessionId,
        workflow_id: workflowId,
        callback_url: 'https://shebn.vercel.app/api/didit/webhook',
        user_data: 'test@shebn.com',
        metadata: {
          platform: 'shebn',
          test_mode: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Didit API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Test session created:', data);

    return NextResponse.json({
      success: true,
      session_data: {
        session_id: data.session_id || sessionId,
        verification_url: data.verification_url || `https://verification.didit.me/v2/session/${data.session_id || sessionId}`,
        status: data.status || 'pending',
        created_at: new Date().toISOString()
      },
      config: {
        apiKey: 'Present',
        workflowId: workflowId,
        url: 'https://verification.didit.me/v2/session/'
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        apiKey: 'Present',
        workflowId: '5uhSPBvSG'
      }
    }, { status: 500 });
  }
} 