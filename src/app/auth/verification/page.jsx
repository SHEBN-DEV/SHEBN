'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function VerificationPage() {
  const [status, setStatus] = useState('idle');
  const { data: session } = useSession();

  const startVerification = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/dtdit/verification/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: session.user.id,
          metadata: {
            email: session.user.email,
            name: session.user.name
          }
        })
      });
      const { verification_url } = await response.json();
      window.location.href = verification_url;
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Verificación de Identidad</h1>
      <p className="mb-6">Necesitamos verificar tu identidad para continuar.</p>
      
      <button
        onClick={startVerification}
        disabled={status === 'loading'}
        className={`w-full py-2 px-4 rounded text-white ${
          status === 'loading' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {status === 'loading' ? 'Cargando...' : 'Iniciar Verificación'}
      </button>
      
      {status === 'error' && (
        <p className="mt-4 text-red-500">Error al iniciar la verificación</p>
      )}
    </div>
  );
}