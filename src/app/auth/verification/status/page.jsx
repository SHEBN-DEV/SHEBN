'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerificationStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      switch (errorParam) {
        case 'gender_not_allowed':
          setMessage('Registro No Permitido');
          setDetails('Esta plataforma está diseñada exclusivamente para mujeres. No se permiten registros de otros géneros.');
          break;
        case 'missing_params':
          setMessage('Error en la Verificación');
          setDetails('Faltan parámetros necesarios para completar la verificación.');
          break;
        case 'profile_not_found':
          setMessage('Perfil No Encontrado');
          setDetails('No se encontró el perfil de usuario asociado.');
          break;
        case 'internal_error':
          setMessage('Error Interno');
          setDetails('Ocurrió un error interno durante la verificación.');
          break;
        default:
          setMessage('Error Desconocido');
          setDetails('Ocurrió un error inesperado durante la verificación.');
      }
    } else if (statusParam) {
      switch (statusParam) {
        case 'completed':
          setStatus('success');
          setMessage('¡Verificación Completada!');
          setDetails('Tu identidad ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de la plataforma.');
          break;
        case 'pending':
          setStatus('pending');
          setMessage('Verificación en Proceso');
          setDetails('Tu verificación está siendo procesada. Te notificaremos cuando esté completa.');
          break;
        case 'rejected':
          setStatus('error');
          setMessage('Verificación Rechazada');
          setDetails('Tu verificación de identidad fue rechazada. Por favor, intenta nuevamente o contacta soporte.');
          break;
        case 'expired':
          setStatus('warning');
          setMessage('Verificación Expirada');
          setDetails('El enlace de verificación ha expirado. Por favor, solicita una nueva verificación.');
          break;
        case 'rejected_gender':
          setStatus('error');
          setMessage('Registro No Permitido');
          setDetails('Esta plataforma está diseñada exclusivamente para mujeres. No se permiten registros de otros géneros.');
          break;
        default:
          setStatus('unknown');
          setMessage('Estado Desconocido');
          setDetails('El estado de la verificación no es reconocido.');
      }
    } else {
      setStatus('error');
      setMessage('Error en la Verificación');
      setDetails('No se pudo determinar el estado de la verificación.');
    }
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-24 h-24 bg-gray-500/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActionButton = () => {
    switch (status) {
      case 'success':
        return (
          <Link href="/auth/login">
            <button className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors">
              INICIAR SESIÓN
            </button>
          </Link>
        );
      case 'error':
        if (searchParams.get('error') === 'gender_not_allowed' || searchParams.get('status') === 'rejected_gender') {
          return (
            <Link href="/">
              <button className="w-full bg-gray-600 text-white rounded-lg py-3 font-semibold hover:bg-gray-700 transition-colors">
                VOLVER AL INICIO
              </button>
            </Link>
          );
        }
        return (
          <Link href="/auth/verification">
            <button className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors">
              INTENTAR NUEVAMENTE
            </button>
          </Link>
        );
      case 'warning':
        return (
          <Link href="/auth/verification">
            <button className="w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors">
              NUEVA VERIFICACIÓN
            </button>
          </Link>
        );
      case 'pending':
        return (
          <Link href="/auth/login">
            <button className="w-full bg-gray-600 text-white rounded-lg py-3 font-semibold hover:bg-gray-700 transition-colors">
              IR AL LOGIN
            </button>
          </Link>
        );
      default:
        return (
          <Link href="/">
            <button className="w-full bg-gray-600 text-white rounded-lg py-3 font-semibold hover:bg-gray-700 transition-colors">
              VOLVER AL INICIO
            </button>
          </Link>
        );
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="mt-4 text-gray-300">Cargando estado de verificación...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        <div className="flex flex-col gap-8 justify-center items-center text-center">
          {getStatusIcon()}
          <div>
            <h1 className="text-3xl font-semibold mb-2">{message}</h1>
            <p className="text-base text-gray-300 max-w-md">
              {details}
            </p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {getActionButton()}
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