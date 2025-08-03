import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    const apiKey = process.env.API_KEY || 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
    const workflowId = process.env.VERIFICATION_WORKFLOW_ID || 'cf449f7e-1848-4e21-a9b4-084000bfdc26';
    
    console.log('🔧 Creando sesión Didit desde backend...');
    console.log('📋 Configuración:', { apiKey: apiKey ? 'Presente' : 'Faltante', workflowId });
    
    const requestBody = {
      workflow_id: workflowId
    };
    
    console.log('📤 Enviando petición a Didit:', {
      url: 'https://verification.didit.me/v2/session/',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey ? 'Presente' : 'Faltante'
      },
      body: requestBody
    });
    
    // Crear sesión usando el endpoint POST correcto según la documentación
    const response = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Respuesta de Didit:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sesión creada con Didit API:', data);
      
      return NextResponse.json({
        success: true,
        verification_url: data.verification_url,
        session_id: data.session_id,
        data: data
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error creando sesión Didit:', response.status, errorData);
      
      return NextResponse.json({
        success: false,
        error: `Error al crear sesión: ${response.status}`,
        details: errorData,
        requestBody: requestBody
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ Error en create-session:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
} 