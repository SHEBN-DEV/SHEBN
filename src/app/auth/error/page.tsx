'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthErrorContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = params.get('code');
    
    switch (code) {
      case 'missing_params':
        setErrorMessage('Faltan parámetros de verificación. Por favor, intenta el registro nuevamente.');
        break;
      case 'verification_failed':
        setErrorMessage('La verificación con Didit falló. Por favor, intenta nuevamente.');
        break;
      case 'invalid_signature':
        setErrorMessage('Error de seguridad en la verificación. Contacta soporte.');
        break;
      default:
        setErrorMessage('Ocurrió un error inesperado. Por favor, intenta nuevamente.');
    }
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error de Verificación
          </h2>
          
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/register')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Intentar Registro Nuevamente
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
} 