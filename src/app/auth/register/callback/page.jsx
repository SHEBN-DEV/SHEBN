'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../SupabaseClient';

function RegisterCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Procesando verificación...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const token = searchParams.get('token');
        const status = searchParams.get('status');
        const userId = searchParams.get('user_id');

        if (!token) {
          setStatus('error');
          setMessage('Token de verificación no encontrado');
          return;
        }

        // Verificar el estado de la verificación
        if (status === 'success' || status === 'verified') {
          setStatus('success');
          setMessage('Verificación exitosa. Completando registro...');

          // Aquí podrías hacer una llamada a tu API para completar el registro
          // con el token de verificación de Didit
          
          // Por ahora, redirigimos a la página de verificación de email
          setTimeout(() => {
            router.push('/auth/verification');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('La verificación no fue exitosa. Inténtalo de nuevo.');
        }

      } catch (error) {
        console.error('Error en callback:', error);
        setStatus('error');
        setMessage('Error al procesar la verificación');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Verificación Didit</h1>
          <p className="text-gray-400 mt-2">Procesando tu verificación</p>
        </div>

        <div className="w-full max-w-md space-y-6">
          
          {status === 'loading' && (
            <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-8 rounded-2xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-300 mx-auto mb-4"></div>
              <p className="text-lg font-semibold">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-8 rounded-2xl text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-lg font-semibold">{message}</p>
              <p className="text-sm mt-2">Redirigiendo automáticamente...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-6 py-8 rounded-2xl text-center">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-lg font-semibold">{message}</p>
              <div className="mt-6 space-y-3">
                <button 
                  onClick={() => router.push('/auth/register')}
                  className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors"
                >
                  Intentar de nuevo
                </button>
                <button 
                  onClick={() => router.push('/auth/login')}
                  className="w-full border border-[#ff29d7] text-[#ff29d7] rounded-lg py-3 font-semibold hover:bg-[#ff29d7] hover:text-white transition-colors"
                >
                  Ir al login
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default function RegisterCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-300">Cargando verificación...</p>
      </div>
    }>
      <RegisterCallbackContent />
    </Suspense>
  );
} 