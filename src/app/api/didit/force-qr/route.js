import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚀 FORZANDO GENERACIÓN DE QR con workflow 5uhSPBvSG');
    
    const apiKey = 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
    const workflowId = '5uhSPBvSG';
    
    const sessionId = `force_qr_${Date.now()}`;
    
    console.log('📋 Configuración:', {
      apiKey: apiKey ? 'Present' : 'Missing',
      workflowId: workflowId,
      sessionId: sessionId
    });
    
    const payload = {
      session_id: sessionId,
      workflow_id: workflowId,
      callback_url: 'https://shebn.vercel.app/api/didit/webhook',
      user_data: 'test@shebn.com',
      metadata: {
        platform: 'shebn',
        force_qr: true,
        test_mode: true
      }
    };

    console.log('📤 Enviando payload a Didit:', payload);

    const response = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Didit API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ QR Session created successfully:', data);

    // Construir URL de verificación con QR
    const verificationUrl = data.verification_url || `https://verification.didit.me/v2/session/${data.session_id || sessionId}`;
    
    console.log('🔗 Verification URL:', verificationUrl);

    return NextResponse.json({
      success: true,
      qr_generated: true,
      session_data: {
        session_id: data.session_id || sessionId,
        verification_url: verificationUrl,
        status: data.status || 'pending',
        created_at: new Date().toISOString()
      },
      config: {
        apiKey: 'Present',
        workflowId: workflowId,
        url: 'https://verification.didit.me/v2/session/'
      },
      qr_info: {
        workflow: '5uhSPBvSG (QR Generation)',
        url: verificationUrl,
        scan_instructions: 'Escanea este QR con tu teléfono para verificar tu identidad'
      }
    });

  } catch (error) {
    console.error('❌ Error forcing QR generation:', error);
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