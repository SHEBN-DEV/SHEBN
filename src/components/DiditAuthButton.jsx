'use client';

import React from 'react';
import { generateDiditAuthUrl } from '@/lib/auth/didit';

export function DiditAuthButton({ variant = 'login' }) {
  const handleAuth = async () => {
    try {
      const authUrl = await generateDiditAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error en autenticación Didit:', error);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleAuth}
        className={`w-full bg-[#ff29d7] text-white rounded-lg py-3 font-semibold hover:bg-[#de69c7] transition-colors`}
      >
        {variant === 'login' ? 'Iniciar sesión con Didit' : 'Registrarse con Didit'}
      </button>
    </div>
  );
} 