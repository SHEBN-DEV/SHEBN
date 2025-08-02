'use client';
import { generateDiditAuthUrl } from '@/lib/auth/didit';

export function DiditAuthButton({ variant = 'login', onSuccess, onError }) {
  const handleAuth = async () => {
    try {
      const authUrl = await generateDiditAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <button
      onClick={handleAuth}
      className={`didit-button ${variant}`}
    >
      {variant === 'login' ? 'Iniciar sesión con Didit' : 'Registrarse con Didit'}
    </button>
  );
}