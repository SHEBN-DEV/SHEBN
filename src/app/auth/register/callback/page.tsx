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
        // 1. Obtener parámetros esenciales (múltiples formatos posibles)
        const sessionId = params.get('session_id') || params.get('sessionId') || params.get('id');
        let status = params.get('status') || 'approved'; // Default para plan gratuito
        const userEmail = params.get('user_data') || params.get('email') || params.get('userEmail');
        const userId = params.get('user_id') || params.get('userId');

        console.log('🔍 Parámetros recibidos de Didit:', {
          sessionId,
          status,
          userEmail: userEmail ? decodeURIComponent(userEmail) : null,
          userId
        });

        console.log('🔍 Todos los parámetros disponibles:', Object.fromEntries(params.entries()));

        // Si no tenemos sessionId, intentar obtenerlo del localStorage
        if (!sessionId) {
          const pendingVerification = localStorage.getItem('pending_verification');
          if (pendingVerification) {
            console.log('🔍 Usando sessionId del localStorage:', pendingVerification);
          }
        }

        // Si no tenemos userEmail, intentar obtenerlo del localStorage
        if (!userEmail) {
          const savedFormData = localStorage.getItem('registration_form_data');
          if (savedFormData) {
            const formData = JSON.parse(savedFormData);
            console.log('🔍 Usando email del formulario guardado:', formData.email);
            userEmail = formData.email;
          }
        }

        if (!sessionId) {
          console.error('❌ No se pudo obtener sessionId');
          throw new Error('Falta session_id de verificación');
        }

        if (!userEmail) {
          console.error('❌ No se pudo obtener userEmail');
          throw new Error('Falta email de verificación');
        }

        const decodedEmail = decodeURIComponent(userEmail);

        // 2. Validar con API de Didit usando el endpoint correcto
        try {
          const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'Cgo01B6fIwTmsH07qZO5oM3ySPqnxm6EB46_o_jVOVw';
          const verificationResponse = await fetch(
            `https://verification.didit.me/v2/sessions/${sessionId}/decision/`,
            {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-key': apiKey
              }
            }
          );

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            console.log('✅ Verificación validada con Didit API:', verificationData);
            
            // Actualizar el status con el resultado real de Didit
            if (verificationData.status) {
              status = verificationData.status;
            }
          } else {
            console.warn('⚠️ No se pudo validar con Didit API, continuando con datos locales');
          }
        } catch (apiError) {
          console.warn('⚠️ Error al validar con Didit API:', apiError);
        }

        // 3. Guardar datos de verificación en localStorage para completar registro
        const verificationData = {
          sessionId,
          status,
          verifiedAt: new Date().toISOString(),
          email: decodedEmail
        };
        
        localStorage.setItem('didit_verification', JSON.stringify(verificationData));
        
        console.log('✅ Datos de verificación guardados:', verificationData);

        // 4. Redirigir al registro para completar el proceso
        router.push('/auth/register?verified=true&session_id=' + sessionId);

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