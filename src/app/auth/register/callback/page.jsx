'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../SupabaseClient';

export default function RegisterCallbackPage() {
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