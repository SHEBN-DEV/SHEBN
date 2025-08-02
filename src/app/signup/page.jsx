'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import InputField from '../../components/inputField';
import PasswordField from '../../components/PasswordField';
import GenderSelect from '../../components/GenderSelect';

const SignUp = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  const router = useRouter();
  const selectedGender = watch('gender');

  const handleSignUpSubmit = async (data) => {
    const { FullName, UserName, email, Password, gender } = data;

    // Validar que el género sea femenino
    if (gender !== 'female') {
      setToastMessage('Solo se permiten registros de género femenino en esta plataforma.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: Password,
          fullName: FullName,
          userName: UserName,
          gender
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en el registro');
      }

      if (result.verification_url) {
        setVerificationUrl(result.verification_url);
        setShowVerification(true);
        setToastMessage('Cuenta creada exitosamente. Continúa con la verificación de identidad.');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Cuenta creada pero hubo un problema con la verificación.');
        setToastType('warning');
        setShowToast(true);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Error inesperado');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueVerification = () => {
    if (verificationUrl) {
      window.open(verificationUrl, '_blank');
    }
  };

  const handleSkipVerification = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center">
      {!showVerification ? (
        <form
          onSubmit={handleSubmit(handleSignUpSubmit)}
          className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center"
        >
          <div className="flex flex-col gap-8 justify-center items-center text-center">
            <p className="text-4xl font-semibold">Sign Up Account</p>
            <p className="text-base">Enter your personal data to create your account.</p>
            <div className="bg-[#ff29d7]/10 border border-[#ff29d7]/30 rounded-lg p-4 max-w-md">
              <p className="text-sm text-[#ff29d7]">
                <strong>Importante:</strong> Esta plataforma está diseñada exclusivamente para mujeres. 
                Solo se permiten registros de género femenino.
              </p>
            </div>
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

            <GenderSelect
              label="Gender"
              name="gender"
              register={register}
              rules={{ required: 'Gender is required' }}
              error={errors.gender}
            />
          </div>

          {selectedGender && selectedGender !== 'female' && (
            <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400">
                <strong>No permitido:</strong> Esta plataforma está diseñada exclusivamente para mujeres. 
                No se permiten registros de otros géneros.
              </p>
            </div>
          )}

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
              disabled={isLoading || selectedGender !== 'female'}
              className={`w-full rounded-2xl py-3 font-semibold transition-all ${
                isLoading || selectedGender !== 'female'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-black border border-white hover:bg-[#ff29d7] hover:text-white'
              }`}
            >
              {isLoading ? 'CREANDO CUENTA...' : 'CREATE AN ACCOUNT'}
            </button>
          </div>
        </form>
      ) : (
        <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
          <div className="flex flex-col gap-8 justify-center items-center text-center">
            <div className="w-24 h-24 bg-[#ff29d7]/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-[#ff29d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">¡Cuenta Creada Exitosamente!</h2>
              <p className="text-base text-gray-300">
                Ahora necesitas verificar tu identidad para completar el registro.
              </p>
            </div>
          </div>

          <div className="w-full bg-[#2d2e33] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Verificación de Identidad</h3>
            <p className="text-sm text-gray-300 mb-6">
              Para garantizar la seguridad de nuestra comunidad exclusiva para mujeres, 
              necesitamos verificar tu identidad a través de Didit.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleContinueVerification}
                className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors"
              >
                CONTINUAR CON VERIFICACIÓN
              </button>
              
              <button
                onClick={handleSkipVerification}
                className="w-full bg-transparent border border-gray-600 text-gray-300 rounded-lg py-3 font-semibold hover:bg-gray-700 transition-colors"
              >
                VERIFICAR DESPUÉS
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg z-50 transition-all duration-300 
                ${toastType === 'success' ? 'bg-green-500' : 
                  toastType === 'error' ? 'bg-red-500' : 
                  toastType === 'warning' ? 'bg-yellow-500' : 'bg-[#ff29d7]'} text-white`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default SignUp;
