'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function DiditRegistration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    user_name: '',
    gender: 'female'
  });
  const [sessionId, setSessionId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Initial registration form
  const handleStartRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/start-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session_id);
        setQrUrl(data.qr_url);
        setStep(2);
        setSuccess('Registro iniciado. Escanea el QR para verificar tu identidad.');
      } else {
        setError(data.error || 'Error al iniciar el registro');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Check verification status
  const checkVerificationStatus = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/didit/check-verification?session_id=${sessionId}`);
      const data = await response.json();

      if (data.verified) {
        setVerificationStatus('approved');
        setStep(3);
        setSuccess('¡Verificación aprobada! Completa tu registro.');
      } else if (data.status === 'not_found') {
        setVerificationStatus('pending');
        setError('Verificación pendiente. Completa el proceso en tu teléfono.');
      } else {
        setVerificationStatus(data.status);
        setError(`Estado de verificación: ${data.status}`);
      }
    } catch (err) {
      setError('Error al verificar estado');
    }
  };

  // Step 3: Complete registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(4);
        setSuccess('¡Registro completado exitosamente!');
      } else {
        setError(data.error || 'Error al completar el registro');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Registro SHEBN</h1>
          <p className="text-gray-600">Verificación de identidad con Didit</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-pink-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm">Datos</span>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-pink-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm">Verificar</span>
          </div>
          <div className={`flex items-center ${step >= 3 ? 'text-pink-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 3 ? 'bg-pink-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm">Completar</span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleStartRegistration} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="María García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={formData.user_name}
                onChange={(e) => updateFormData('user_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="maria_garcia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => updateFormData('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Registro'}
            </button>
          </form>
        )}

        {/* Step 2: QR Verification */}
        {step === 2 && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Verifica tu Identidad
              </h2>
              <p className="text-gray-600 mb-6">
                Escanea este código QR con tu teléfono para verificar tu identidad
              </p>
            </div>

            {qrUrl && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="mb-4">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  O abre este enlace en tu teléfono:
                </p>
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 text-sm break-all hover:underline"
                >
                  {qrUrl}
                </a>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={checkVerificationStatus}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
              >
                Verificar Estado
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete Registration */}
        {step === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Completa tu Registro
              </h2>
              <p className="text-green-600 text-sm text-center mb-6">
                ✅ Verificación aprobada. Solo mujeres pueden registrarse.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Tu contraseña"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completando...' : 'Completar Registro'}
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
            >
              Volver
            </button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="text-green-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              ¡Registro Completado!
            </h2>
            <p className="text-gray-600">
              Tu cuenta ha sido creada exitosamente con verificación de identidad.
            </p>
            <button
              onClick={() => {
                setStep(1);
                setFormData({ email: '', full_name: '', user_name: '', gender: 'female' });
                setPassword('');
                setError('');
                setSuccess('');
              }}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700"
            >
              Registrar Otro Usuario
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 