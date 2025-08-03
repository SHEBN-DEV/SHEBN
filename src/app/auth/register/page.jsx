'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '../../SupabaseClient';
import InputField from '../../components/inputField';
import PasswordField from '../../components/PasswordField';
import GenderSelect from '../../components/GenderSelect';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const gender = watch('gender');

  const handleRegister = async (data) => {
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

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            user_name: data.userName,
            gender: data.gender
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        setSuccess('Registro exitoso. Redirigiendo a verificación...');
        
        // Redirigir a la página de verificación después de 2 segundos
        setTimeout(() => {
          router.push('/auth/verification');
        }, 2000);
      }

    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error interno del servidor');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Registrarse</h1>
          <p className="text-gray-400 mt-2">Únete a la comunidad de mujeres en Web3</p>
        </div>

        <form 
          onSubmit={handleSubmit(handleRegister)} 
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
              {loading ? "Registrando..." : "REGISTRARSE"}
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