import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚀 VERIFICANDO QR con documentación oficial de Didit');
    
    const apiKey = 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
    const workflowId = '5uhSPBvSG';
    
    console.log('📋 Configuración según documentación oficial:', {
      apiKey: apiKey ? 'Present' : 'Missing',
      workflowId: workflowId,
      endpoint: 'https://verification.didit.me/v2/session/',
      method: 'POST'
    });
    
    // Payload exacto según documentación oficial
    const payload = {
      workflow_id: workflowId
    };

    console.log('📤 Enviando payload según documentación oficial:', payload);

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
    const verificationUrl = data.verification_url || data.url || `https://verification.didit.me/v2/session/${data.session_id}`;
    
    console.log('🔗 Verification URL:', verificationUrl);

    return NextResponse.json({
      success: true,
      qr_generated: true,
      documentation_followed: true,
      session_data: {
        session_id: data.session_id,
        verification_url: verificationUrl,
        status: data.status || 'pending',
        created_at: new Date().toISOString()
      },
      config: {
        apiKey: 'Present',
        workflowId: workflowId,
        url: 'https://verification.didit.me/v2/session/',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': 'Present'
        }
      },
      qr_info: {
        workflow: '5uhSPBvSG (QR Generation)',
        url: verificationUrl,
        scan_instructions: 'Escanea este QR con tu teléfono para verificar tu identidad',
        documentation_source: 'https://docs.didit.me/reference/create-session-verification-sessions'
      },
      raw_response: data
    });

  } catch (error) {
    console.error('❌ Error verifying QR generation:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      documentation_followed: true,
      config: {
        apiKey: 'Present',
        workflowId: '5uhSPBvSG',
        url: 'https://verification.didit.me/v2/session/'
      }
    }, { status: 500 });
  }
} 