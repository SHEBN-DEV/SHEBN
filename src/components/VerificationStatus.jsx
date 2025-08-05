'use client';
import { useState, useEffect } from 'react';

export default function VerificationStatus({ userId, sessionId }) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (sessionId) params.append('session_id', sessionId);

        const response = await fetch(`/api/didit/check-verification?${params}`);
        const data = await response.json();

        if (response.ok) {
          setVerification(data);
        } else {
          setError(data.error || 'Error al verificar estado');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (userId || sessionId) {
      checkVerification();
    }
  }, [userId, sessionId]);

  if (loading) {
    return (
      <div className="bg-[#2d2e33] rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ff29d7]"></div>
          <span className="text-white">Verificando estado...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-2">❌ Error</h3>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Sin Verificación</h3>
        <p className="text-yellow-300">No se encontró verificación para este usuario</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case 'F':
        return 'Femenino';
      case 'M':
        return 'Masculino';
      default:
        return 'No especificado';
    }
  };

  return (
    <div className="bg-[#2d2e33] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Estado de Verificación</h2>
        <div className={`flex items-center space-x-2 ${getStatusColor(verification.status)}`}>
          <span className="text-lg">{getStatusIcon(verification.status)}</span>
          <span className="font-semibold uppercase">{verification.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2 text-[#ff29d7]">📋 Información Personal</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Nombre:</strong> {verification.first_name || 'No disponible'}</p>
            <p><strong>Apellido:</strong> {verification.last_name || 'No disponible'}</p>
            <p><strong>Género:</strong> {getGenderText(verification.gender)}</p>
            <p><strong>Fecha de Nacimiento:</strong> {verification.date_of_birth || 'No disponible'}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-[#ff29d7]">🆔 Información del Documento</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Número de Documento:</strong> {verification.document_number || 'No disponible'}</p>
            <p><strong>Estado de Emisión:</strong> {verification.issuing_state || 'No disponible'}</p>
            <p><strong>Session ID:</strong> {verification.session_id}</p>
            <p><strong>Verificado:</strong> {verification.verified ? 'Sí' : 'No'}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600">
        <h3 className="font-semibold mb-2 text-[#ff29d7]">📅 Fechas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><strong>Creado:</strong> {new Date(verification.created_at).toLocaleString()}</p>
          <p><strong>Actualizado:</strong> {new Date(verification.updated_at).toLocaleString()}</p>
        </div>
      </div>

      {verification.verified && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h3 className="font-semibold mb-2 text-green-400">🎉 Verificación Completada</h3>
          <p className="text-green-300 text-sm">
            Tu identidad ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de la plataforma.
          </p>
        </div>
      )}
    </div>
  );
} 