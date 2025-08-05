'use client';
import { useState, useEffect } from 'react';

export default function QRTestPage() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 GENERANDO QR DESDE PÁGINA DIRECTA');
      
      const apiKey = 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
      const workflowId = '5uhSPBvSG';
      const sessionId = `page_qr_${Date.now()}`;
      
      const payload = {
        session_id: sessionId,
        workflow_id: workflowId,
        callback_url: 'https://shebn.vercel.app/api/didit/webhook',
        user_data: 'test@shebn.com',
        metadata: {
          platform: 'shebn',
          page_qr: true,
          test_mode: true
        }
      };

      console.log('📤 Enviando payload desde página:', payload);

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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Didit API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ QR Session created from page:', data);

      const verificationUrl = data.verification_url || `https://verification.didit.me/v2/session/${data.session_id || sessionId}`;
      
      setQrData({
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
      console.error('❌ Error generating QR from page:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1718] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🚀 QR Generation Test</h1>
        
        <div className="bg-[#2d2e33] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>API Key:</strong> Present
            </div>
            <div>
              <strong>Workflow ID:</strong> 5uhSPBvSG
            </div>
            <div>
              <strong>Endpoint:</strong> https://verification.didit.me/v2/session/
            </div>
            <div>
              <strong>Método:</strong> POST
            </div>
          </div>
        </div>

        <div className="bg-[#2d2e33] rounded-lg p-6 mb-6">
          <button
            onClick={generateQR}
            disabled={loading}
            className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors disabled:opacity-50"
          >
            {loading ? '🔄 Generando QR...' : '🚀 GENERAR QR DIRECTAMENTE'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {qrData && (
          <div className="bg-[#2d2e33] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">✅ QR Generado Exitosamente</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">📋 Información de Sesión</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Session ID:</strong> {qrData.session_data.session_id}</p>
                  <p><strong>Status:</strong> {qrData.session_data.status}</p>
                  <p><strong>Created:</strong> {new Date(qrData.session_data.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">🔗 URL de Verificación</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>URL:</strong></p>
                  <a 
                    href={qrData.session_data.verification_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#ff29d7] hover:text-[#de69c7] break-all"
                  >
                    {qrData.session_data.verification_url}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#ff29d7]/10 border border-[#ff29d7]/30 rounded-lg">
              <h3 className="font-semibold mb-2 text-[#ff29d7]">📱 Instrucciones</h3>
              <p className="text-sm">
                {qrData.qr_info.scan_instructions}
              </p>
              <p className="text-sm mt-2">
                <strong>Workflow:</strong> {qrData.qr_info.workflow}
              </p>
            </div>

            <div className="mt-4">
              <a
                href={qrData.session_data.verification_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#ff29d7] text-white rounded-lg px-6 py-2 font-semibold hover:bg-[#de69c7] transition-colors"
              >
                🔗 Abrir Verificación
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 