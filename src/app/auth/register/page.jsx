'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '../../SupabaseClient';
import InputField from '../../../components/inputField';
import PasswordField from '../../../components/PasswordField';
import GenderSelect from '../../../components/GenderSelect';
import { generateDiditAuthUrl } from '../../../lib/auth/didit';

function RegisterPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: Didit Verification
  const [formData, setFormData] = useState(null);
  const [verifiedSessionId, setVerifiedSessionId] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const gender = watch('gender');
  const searchParams = useSearchParams();

  // Detectar si el usuario viene de una verificación exitosa
  useEffect(() => {
    const verified = searchParams.get('verified');
    const sessionId = searchParams.get('session_id');
    
    console.log('🔍 Detectando parámetros de verificación:', { verified, sessionId });
    
    if (verified === 'true' && sessionId) {
      console.log('✅ Verificación detectada, procesando...');
      setVerifiedSessionId(sessionId);
      setSuccess('Verificación Didit completada exitosamente');
      
      // Si tenemos datos del formulario guardados, completar el registro automáticamente
      const savedFormData = localStorage.getItem('registration_form_data');
      console.log('📋 Datos del formulario guardados:', { hasData: !!savedFormData });
      
      if (savedFormData) {
        const parsedFormData = JSON.parse(savedFormData);
        setFormData(parsedFormData);
        
        console.log('🔄 Iniciando registro automático en 2 segundos...');
        
        // Completar el registro automáticamente
        setTimeout(() => {
          handleCompleteRegistration(parsedFormData, sessionId);
        }, 2000);
      } else {
        console.error('❌ No se encontraron datos del formulario guardados');
        setError('Error: No se encontraron datos del formulario');
      }
    }
  }, [searchParams]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar que el género sea femenino
      if (data.gender !== 'female') {
        setError('Solo se permiten registros de género femenino');
        setLoading(false);
        return;
      }

      // Guardar datos del formulario en localStorage
      localStorage.setItem('registration_form_data', JSON.stringify(data));

      // Guardar datos del formulario y pasar al paso 2
      setFormData(data);
      setStep(2);
      setSuccess('Formulario completado. Procediendo a verificación...');

    } catch (error) {
      console.error('Error en validación:', error);
      setError('Error interno del servidor');
    }

    setLoading(false);
  };

  const handleCompleteRegistration = async (formData, sessionId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🚀 Iniciando proceso de registro completo...');
      
      // Obtener datos de verificación
      const verificationData = localStorage.getItem('didit_verification');
      const verification = verificationData ? JSON.parse(verificationData) : null;

      console.log('🔧 Datos para registro:', { 
        formData, 
        sessionId, 
        verification,
        hasVerificationData: !!verificationData
      });

      // Validar datos requeridos
      if (!formData.email || !formData.password) {
        throw new Error('Faltan datos requeridos para el registro');
      }

      console.log('📤 Creando usuario en Supabase Auth...');

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_name: formData.userName,
            gender: formData.gender,
            didit_verified: verification ? true : false,
            didit_session_id: sessionId,
            verification_status: verification?.status || 'approved'
          }
        }
      });

      console.log('📥 Respuesta de Supabase:', { authData, authError });

      if (authError) {
        console.error('❌ Error en registro Supabase:', authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('✅ Usuario creado en Supabase Auth:', authData.user);
        
        // Crear perfil manualmente en caso de que el trigger no funcione
        try {
          console.log('📝 Creando perfil manualmente...');
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: formData.fullName,
              user_name: formData.userName,
              email: formData.email,
              gender: formData.gender,
              verification_status: verification?.status || 'approved',
              didit_verified: verification ? true : false,
              didit_session_id: sessionId,
              verification_data: verification ? {
                session_id: sessionId,
                status: verification.status,
                verified_at: verification.verifiedAt
              } : null
            })
            .select()
            .single();
          
          if (profileError) {
            console.warn('⚠️ Error creando perfil manualmente:', profileError);
            // Continuar aunque falle, el trigger debería haberlo creado
          } else {
            console.log('✅ Perfil creado manualmente:', profileData);
          }
        } catch (profileError) {
          console.warn('⚠️ Error en creación manual de perfil:', profileError);
        }
        
        // Verificar que el perfil existe
        try {
          console.log('🔍 Verificando que el perfil existe...');
          
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (checkError) {
            console.error('❌ Error verificando perfil:', checkError);
          } else if (existingProfile) {
            console.log('✅ Perfil verificado:', existingProfile);
          } else {
            console.error('❌ Perfil no encontrado después de la creación');
          }
        } catch (verifyError) {
          console.error('❌ Error en verificación de perfil:', verifyError);
        }
        
        // Limpiar datos temporales
        localStorage.removeItem('registration_form_data');
        localStorage.removeItem('didit_verification');
        localStorage.removeItem('pending_verification');
        
        setSuccess('¡Registro completado exitosamente! Redirigiendo al dashboard...');
        
        // Redirigir al dashboard
        setTimeout(() => {
          router.push('/dashboard?verified=true');
        }, 2000);
      } else {
        console.error('❌ No se recibió usuario de Supabase');
        setError('Error: No se pudo crear el usuario');
      }

    } catch (error) {
      console.error('❌ Error completando registro:', error);
      setError('Error al completar el registro: ' + error.message);
    }

    setLoading(false);
  };

    const handleDiditVerification = async () => {
    setLoading(true);
    setError('');

    try {
      // Guardar temporalmente el email en localStorage para recuperarlo en el callback
      localStorage.setItem('pending_verification', formData.email);
      
      console.log('🔧 Iniciando verificación Didit...');
      
      // Crear sesión usando nuestro endpoint backend (evita CORS)
      const response = await fetch('/api/didit/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión creada con Didit:', data);
        
        // Usar la URL de verificación proporcionada por Didit
        if (data.verification_url) {
          console.log('🔗 Redirigiendo a Didit:', data.verification_url);
          window.location.href = data.verification_url;
        } else {
          throw new Error('No se recibió URL de verificación de Didit');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error creando sesión Didit:', response.status, errorData);
        throw new Error(errorData.error || `Error al crear sesión: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error al iniciar verificación Didit:', error);
      setError('Error al iniciar la verificación: ' + error.message);
      setLoading(false);
    }
  };

  const handleSkipDidit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Crear usuario en Supabase Auth con verificación Didit si está disponible
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_name: formData.userName,
            gender: formData.gender,
            didit_verified: verifiedSessionId ? true : false,
            didit_session_id: verifiedSessionId || null
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const successMessage = verifiedSessionId 
          ? 'Registro exitoso con verificación Didit. Redirigiendo...'
          : 'Registro exitoso. Redirigiendo a verificación...';
        
        setSuccess(successMessage);
        
        // Redirigir según si tiene verificación o no
        setTimeout(() => {
          if (verifiedSessionId) {
            router.push('/');
          } else {
            router.push('/auth/verification');
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error interno del servidor');
    }

    setLoading(false);
  };

  // Renderizar paso 1: Formulario de registro
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
        <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
          
          <div className="text-center">
            <h1 className="text-4xl font-semibold">Registrarse</h1>
            <p className="text-gray-400 mt-2">Únete a la comunidad de mujeres en Web3</p>
          </div>

          <form 
            onSubmit={handleSubmit(handleFormSubmit)} 
            className="w-full max-w-md space-y-6"
          >
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <InputField 
              label="Nombre Completo"
              name="fullName"
              register={register}
              rules={{ required: "Nombre completo es requerido" }}
              error={errors.fullName}
            />

            <InputField 
              label="Nombre de Usuario"
              name="userName"
              register={register}
              rules={{ required: "Nombre de usuario es requerido" }}
              error={errors.userName}
            />

            <InputField 
              label="Email"
              name="email"
              type="email"
              register={register}
              rules={{ 
                required: "Email es requerido",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido"
                }
              }}
              error={errors.email}
            />

            <GenderSelect 
              register={register}
              error={errors.gender}
            />

            <PasswordField 
              label="Contraseña"
              name="password"
              register={register}
              rules={{ 
                required: "Contraseña es requerida",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres"
                }
              }}
              error={errors.password}
            />

            <PasswordField 
              label="Confirmar Contraseña"
              name="confirmPassword"
              register={register}
              rules={{ 
                required: "Confirmar contraseña es requerida",
                validate: (value) => {
                  const password = watch('password');
                  return value === password || "Las contraseñas no coinciden";
                }
              }}
              error={errors.confirmPassword}
            />

            <div className="w-full">
              <button 
                type="submit" 
                disabled={loading || gender !== 'female'} 
                className={`w-full rounded-2xl py-3 font-semibold transition-colors ${
                  loading || gender !== 'female'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#ff29d7] text-white hover:bg-[#de69c7]'
                }`}
              >
                {loading ? "Validando..." : "CONTINUAR"}
              </button>
            </div>

            {gender && gender !== 'female' && (
              <div className="text-center text-red-400 text-sm">
                Esta plataforma está diseñada exclusivamente para mujeres
              </div>
            )}

          </form>

          <div className="text-center">
            <p className="text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <a href="/auth/login" className="text-[#ff29d7] hover:text-[#de69c7]">
                Iniciar sesión
              </a>
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Renderizar paso 2: Verificación Didit
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Verificación de Identidad</h1>
          <p className="text-gray-400 mt-2">Completa la verificación con Didit para continuar</p>
        </div>

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg w-full max-w-md">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg w-full max-w-md">
            {error}
          </div>
        )}

        <div className="w-full max-w-md space-y-6">
          
          <div className="bg-[#2d2e33] rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-center">¿Por qué verificamos tu identidad?</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Garantizar que eres una mujer real</li>
              <li>• Proteger la comunidad de usuarios falsos</li>
              <li>• Cumplir con los requisitos de la plataforma</li>
              <li>• Proceso rápido y seguro</li>
            </ul>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleDiditVerification}
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold transition-colors ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff29d7] text-white hover:bg-[#de69c7]'
              }`}
            >
              {loading ? "Iniciando verificación..." : "VERIFICAR CON DIDIT"}
            </button>

            <button 
              onClick={handleSkipDidit}
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold transition-colors border ${
                loading
                  ? 'border-gray-600 text-gray-400 cursor-not-allowed'
                  : 'border-[#ff29d7] text-[#ff29d7] hover:bg-[#ff29d7] hover:text-white'
              }`}
            >
              {loading ? "Procesando..." : "CONTINUAR SIN VERIFICACIÓN"}
            </button>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setStep(1)}
              className="text-gray-400 hover:text-[#ff29d7] text-sm"
            >
              ← Volver al formulario
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-300">Cargando registro...</p>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}