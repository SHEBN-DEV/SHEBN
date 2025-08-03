'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function DiditCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const sessionId = params.get('session_id');
    const userEmail = params.get('user_data');

    if (sessionId && userEmail) {
      console.log('Datos recibidos de Didit:', {
        sessionId,
        userEmail: decodeURIComponent(userEmail)
      });
      
      // Redirige después de procesar
      router.push('/dashboard?verified=true');
    } else {
      router.push('/auth/error?code=missing_params');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Procesando verificación...</p>
    </div>
  );
} 