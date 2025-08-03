'use client';
import { DiditAuthButton } from '@/components/DiditAuthButton';

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Registrarse</h1>
      <form className="space-y-4">
        {/* Campos del formulario */}
        <DiditAuthButton variant="register" />
      </form>
    </div>
  );
}