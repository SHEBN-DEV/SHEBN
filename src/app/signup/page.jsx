'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import InputField from '../components/inputField';
import PasswordField from '../components/PasswordField';

const SignUp = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [qrUrl, setQrUrl] = useState(null);

  const router = useRouter();

  const handleSignUpSubmit = async (data) => {
    const { FullName, UserName, email, Password } = data;
 // Paso 1: crear cuenta de autenticación en Supabase
    try {
      // Paso 1: crear cuenta de autenticación en Supabase
      const resAuth = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: Password }),
      });
      
      const authText = await resAuth.text();
      let auth;
      try {
        auth = JSON.parse(authText);
      } catch (error) {
        console.error(' Error parseando JSON de /api/auth/signup:', authText);
        throw new Error('Respuesta inválida del servidor de autenticación');
      }
      
      if (!resAuth.ok || !auth?.user) {
        throw new Error(auth?.error || 'No se pudo crear el usuario');
      }
      
      const userId = auth.user.id;

      // Paso 2: llamar a /api/registro para crear perfil y generar QR
      const resRegistro = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          full_name: FullName,
          user_name: UserName,
          email: email,
        }),
      });
      
      const registroText = await resRegistro.text();
      let result;
      try {
        result = JSON.parse(registroText);
      } catch (error) {
        console.error('❌ Error parseando JSON de /api/registro:', registroText);
        throw new Error('Respuesta inválida del servidor de registro');
      }
      
      if (result.qr) {
        setQrUrl(result.qr);
        setToastMessage('Cuenta creada, escanea el QR para verificar tu identidad.');
        setToastType('success');
        setShowToast(true);
      } else {
        throw new Error(result.error || 'Error generando el QR');
      }
      
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Error inesperado');
      setToastType("error");
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center">
      <form
        onSubmit={handleSubmit(handleSignUpSubmit)}
        className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center"
      >
        <div className="flex flex-col gap-8 justify-center items-center text-center">
          <p className="text-4xl font-semibold">Sign Up Account</p>
          <p className="text-base">Enter your personal data to create your account.</p>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-5">
          <InputField
            label="Full Name"
            name="FullName"
            register={register}
            rules={{ required: 'Full name is required' }}
            error={errors.FullName}
          />
          <InputField
            label="User Name"
            name="UserName"
            register={register}
            rules={{ required: 'User name is required' }}
            error={errors.UserName}
          />
        </div>

        <div className="w-full flex flex-col gap-6">
          <InputField
            label="Email"
            name="email"
            type="email"
            register={register}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            }}
            error={errors.email}
          />

          <PasswordField
            label="Password"
            name="Password"
            register={register}
            rules={{
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimiun 8 characters' },
            }}
            error={errors.Password}
          />
        </div>

        <div className="w-full flex justify-end py-5 pr-8">
          <p>
            Already A Member?{' '}
            <a href="/login" className="text-[#ff29d7] hover:text-[#de69c7]">
              Log In
            </a>
          </p>
        </div>

        <div className="w-full">
          <button
            type="submit"
            className="w-full bg-black border border-white rounded-2xl py-3 font-semibold hover:bg-[#ff29d7] hover:text-white"
          >
            CREATE AN ACCOUNT
          </button>
        </div>
      </form>

      {qrUrl && (
        <div className="text-center mt-4">
          <h3 className="text-xl mb-2">Verificación de Identidad</h3>
          <p>Escanea este código QR para continuar el proceso de verificación:</p>
          <img src={qrUrl} alt="QR de verificación Didit" className="mx-auto mt-4 w-48 h-48" />
        </div>
      )}

      {showToast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg z-50 transition-all duration-300 
                ${toastType === 'success' ? 'bg-[#ff29d7]' : 'bg-red-500'} text-white`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default SignUp;
