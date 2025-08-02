'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../SupabaseClient';

export default function VerificationPage() {
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Obtener perfil del usuario
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error obteniendo perfil:', error);
        router.push('/auth/login');
        return;
      }

      setProfile(profileData);

      // Si ya está verificada, redirigir
      if (profileData.verification_status === 'completed') {
        router.push('/');
        return;
      }
    };

    checkUser();
  }, [router]);

  const startVerification = async () => {
    if (!user || !profile) return;

    setStatus('loading');
    
    try {
      const response = await fetch('/api/didit/verification/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          metadata: {
            email: user.email,
            name: profile.full_name,
            gender: profile.gender
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al generar verificación');
      }

      if (result.verification_url) {
        setVerificationUrl(result.verification_url);
        setStatus('ready');
      } else {
        throw new Error('No se recibió URL de verificación');
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      setStatus('error');
    }
  };

  const handleContinueVerification = () => {
    if (verificationUrl) {
      window.open(verificationUrl, '_blank');
    }
  };

  const handleCheckStatus = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', user.id)
        .single();

      if (profileData.verification_status === 'completed') {
        router.push('/');
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
    }
  };

  const handleManualVerification = async () => {
    if (!user) return;

    setStatus('loading');
    
    try {
      const response = await fetch('/api/didit/verification/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          verificationData: {
            method: 'manual',
            timestamp: new Date().toISOString(),
            user_info: {
              email: user.email,
              name: profile?.full_name
            }
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('completed');
        router.push('/auth/verification/status?status=completed');
      } else {
        throw new Error(result.error || 'Error en verificación manual');
      }
    } catch (error) {
      console.error('Error en verificación manual:', error);
      setStatus('error');
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="mt-4 text-gray-300">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        <div className="flex flex-col gap-8 justify-center items-center text-center">
          <div className="w-24 h-24 bg-[#ff29d7]/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-[#ff29d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-2">Verificación de Identidad</h1>
            <p className="text-base text-gray-300">
              Para garantizar la seguridad de nuestra comunidad exclusiva para mujeres, 
              necesitamos verificar tu identidad.
            </p>
          </div>
        </div>

        <div className="w-full bg-[#2d2e33] rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Información de tu cuenta:</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Nombre:</strong> {profile.full_name}</p>
              <p><strong>Usuario:</strong> {profile.user_name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Género:</strong> {profile.gender === 'female' ? 'Femenino' : profile.gender}</p>
              <p><strong>Estado:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  profile.verification_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  profile.verification_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  profile.verification_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {profile.verification_status === 'completed' ? 'Verificada' :
                   profile.verification_status === 'pending' ? 'Pendiente' :
                   profile.verification_status === 'rejected' ? 'Rechazada' :
                   'No verificada'}
                </span>
              </p>
            </div>
          </div>

          {profile.gender !== 'female' && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400">
                <strong>No permitido:</strong> Esta plataforma está diseñada exclusivamente para mujeres. 
                No se permiten registros de otros géneros.
              </p>
            </div>
          )}

          {status === 'idle' && profile.gender === 'female' && (
            <button
              onClick={startVerification}
              className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors"
            >
              INICIAR VERIFICACIÓN
            </button>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-gray-300">Preparando verificación...</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-400">
                  <strong>¡Listo!</strong> Tu verificación está preparada. Haz clic en continuar para proceder.
                </p>
              </div>
              
              <button
                onClick={handleContinueVerification}
                className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors"
              >
                CONTINUAR CON VERIFICACIÓN DIDIT
              </button>
              
              <button
                onClick={handleManualVerification}
                className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors"
              >
                VERIFICACIÓN MANUAL (PLAN GRATUITO)
              </button>
              
              <button
                onClick={handleCheckStatus}
                className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg py-3 font-semibold hover:bg-gray-700 transition-colors"
              >
                VERIFICAR ESTADO
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-400">
                  <strong>Error:</strong> No se pudo iniciar la verificación. Por favor, intenta nuevamente.
                </p>
              </div>
              
              <button
                onClick={startVerification}
                className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors"
              >
                INTENTAR NUEVAMENTE
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            ¿Necesitas ayuda?{' '}
            <a href="/contact" className="text-[#ff29d7] hover:text-[#de69c7]">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}