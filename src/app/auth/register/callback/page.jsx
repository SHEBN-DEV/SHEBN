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
        // 1. Get essential parameters (multiple possible formats)
        const sessionId = params.get('session_id') || params.get('sessionId') || params.get('id');
        let status = params.get('status') || 'approved'; // Default for free plan
        let userEmail = params.get('user_data') || params.get('email') || params.get('userEmail');
        const userId = params.get('user_id') || params.get('userId');

        console.log('🔍 Parameters received from Didit:', {
          sessionId,
          status,
          userEmail: userEmail ? decodeURIComponent(userEmail) : null,
          userId
        });

        console.log('🔍 All available parameters:', Object.fromEntries(params.entries()));

        // If we don't have sessionId, try to get it from localStorage
        if (!sessionId) {
          const pendingVerification = localStorage.getItem('pending_verification');
          if (pendingVerification) {
            console.log('🔍 Using sessionId from localStorage:', pendingVerification);
          }
        }

        // If we don't have userEmail, try to get it from localStorage
        if (!userEmail) {
          const savedFormData = localStorage.getItem('registration_form_data');
          if (savedFormData) {
            const formData = JSON.parse(savedFormData);
            console.log('🔍 Using email from saved form:', formData.email);
            userEmail = formData.email;
          }
        }

        if (!sessionId) {
          console.error('❌ Could not get sessionId');
          throw new Error('Missing session_id from verification');
        }

        if (!userEmail) {
          console.error('❌ Could not get userEmail');
          throw new Error('Missing email from verification');
        }

        const decodedEmail = decodeURIComponent(userEmail);

        // 2. Validate with Didit API using the correct endpoint
        try {
          const verificationResponse = await fetch(`/api/didit/check-verification?session_id=${sessionId}&email=${encodeURIComponent(decodedEmail)}`);
          
          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            console.log('✅ Verification validated with Didit API:', verificationData);
            
            // Update status with real result from Didit
            if (verificationData.status) {
              status = verificationData.status;
            }
          } else {
            console.warn('⚠️ Could not validate with Didit API, continuing with local data');
          }
        } catch (apiError) {
          console.warn('⚠️ Error validating with Didit API:', apiError);
        }

        // 3. Store verification data in localStorage to complete registration
        const verificationData = {
          sessionId,
          status,
          verifiedAt: new Date().toISOString(),
          email: decodedEmail,
          userId: userId
        };
        
        localStorage.setItem('didit_verification', JSON.stringify(verificationData));
        
        console.log('✅ Verification data stored:', verificationData);

        // 4. Redirect to registration to complete the process
        router.push('/auth/register?verified=true&session_id=' + sessionId);

      } catch (error) {
        console.error('❌ Error in callback:', error);
        router.push('/auth/error?code=verification_failed');
      }
    };

    processCallback();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing verification with Didit...</p>
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DiditCallbackContent />
    </Suspense>
  );
} 