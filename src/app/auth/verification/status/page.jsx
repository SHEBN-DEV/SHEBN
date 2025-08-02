'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function VerificationStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  useEffect(() => {
    if (status === 'completed') {
      // Redirigir después de 3 segundos
      const timer = setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      {status === 'completed' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-green-600">¡Verificación Exitosa!</h1>
          <p>Serás redirigido automáticamente...</p>
        </>
      )}
      
      {status === 'declined' && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Verificación Rechazada</h1>
          <p className="mb-4">No pudimos verificar tu identidad.</p>
          <a href="/auth/verification" className="text-blue-600 hover:underline">
            Intentar nuevamente
          </a>
        </>
      )}
      
      {error && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="mb-4">{error}</p>
        </>
      )}
    </div>
  );
}