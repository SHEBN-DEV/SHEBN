'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '../../SupabaseClient';
import InputField from '../../../components/inputField';
import PasswordField from '../../../components/PasswordField';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const handleLogin = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Iniciar sesión con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        setSuccess('Inicio de sesión exitoso. Redirigiendo...');
        
        // Redirigir al dashboard o página principal después de 2 segundos
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }

    } catch (error) {
      console.error('Error en login:', error);
      setError('Error interno del servidor');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Iniciar Sesión</h1>
          <p className="text-gray-400 mt-2">Accede a tu cuenta de SHEBN</p>
        </div>

        <form 
          onSubmit={handleSubmit(handleLogin)} 
          className="w-full max-w-md space-y-6"
        >
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

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

          <PasswordField 
            label="Contraseña"
            name="password"
            register={register}
            rules={{ 
              required: "Contraseña es requerida"
            }}
            error={errors.password}
          />

          <div className="w-full">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold transition-colors ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff29d7] text-white hover:bg-[#de69c7]'
              }`}
            >
              {loading ? "Iniciando sesión..." : "INICIAR SESIÓN"}
            </button>
          </div>

        </form>

        <div className="text-center space-y-4">
          <p className="text-gray-400">
            ¿No tienes cuenta?{' '}
            <a href="/auth/register" className="text-[#ff29d7] hover:text-[#de69c7]">
              Registrarse
            </a>
          </p>
          
          <p className="text-gray-400">
            <a href="/auth/forgot-password" className="text-[#ff29d7] hover:text-[#de69c7]">
              ¿Olvidaste tu contraseña?
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}