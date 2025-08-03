'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../../SupabaseClient';

function DiditCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 1. Obtener parámetros esenciales
        const sessionId = params.get('session_id');
        const status = params.get('status') || 'approved'; // Default para plan gratuito
        const userEmail = params.get('user_data');
        const userId = params.get('user_id');

        console.log('🔍 Parámetros recibidos de Didit:', {
          sessionId,
          status,
          userEmail: userEmail ? decodeURIComponent(userEmail) : null,
          userId
        });

        if (!sessionId || !userEmail) {
          throw new Error('Faltan parámetros de verificación');
        }

        const decodedEmail = decodeURIComponent(userEmail);

        // 2. Validar con API de Didit (opcional pero recomendado)
        try {
          const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
          const verificationResponse = await fetch(
            `https://api.didit.me/v1/sessions/${sessionId}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            console.log('✅ Verificación validada con Didit API:', verificationData);
          } else {
            console.warn('⚠️ No se pudo validar con Didit API, continuando con datos locales');
          }
        } catch (apiError) {
          console.warn('⚠️ Error al validar con Didit API:', apiError);
        }

        // 3. Actualizar usuario en Supabase
        const { data, error } = await supabase
          .from('profiles')
          .update({
            didit_verified: status === 'approved' || status === 'success',
            verification_status: status,
            didit_session_id: sessionId,
            verification_data: {
              session_id: sessionId,
              status: status,
              verified_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('email', decodedEmail)
          .select();

        if (error) {
          console.error('❌ Error actualizando Supabase:', error);
          throw error;
        }

        console.log('✅ Usuario actualizado en Supabase:', data);

        // 4. Redirigir con estado de éxito
        router.push('/dashboard?verified=true');

      } catch (error) {
        console.error('❌ Error en callback:', error);
        router.push('/auth/error?code=verification_failed');
      }
    };

    processCallback();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Procesando verificación con Didit...</p>
      </div>
    </div>
  );
}

export default function DiditCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <DiditCallbackContent />
    </Suspense>
  );
} 