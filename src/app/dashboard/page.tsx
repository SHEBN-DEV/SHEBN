'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const params = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<string>('');

  useEffect(() => {
    const verified = params.get('verified');
    if (verified === 'true') {
      setVerificationStatus('success');
    }
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {verificationStatus === 'success' ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  ¡Verificación Exitosa!
                </h1>
                <p className="text-gray-600 mb-6">
                  Tu cuenta ha sido verificada correctamente con Didit. Ya puedes acceder a todas las funcionalidades de SHEBN.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Dashboard de SHEBN
                </h1>
                <p className="text-gray-600 mb-6">
                  Bienvenido a tu panel de control.
                </p>
              </>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Mi Perfil</h3>
                <p className="text-blue-700">Gestiona tu información personal</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Proyectos</h3>
                <p className="text-green-700">Explora y crea proyectos</p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Amigos</h3>
                <p className="text-purple-700">Conecta con otros usuarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
} 