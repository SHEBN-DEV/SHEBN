#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Uso: node scripts/check-env.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: join(__dirname, '..', '.env.local') });

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Variables requeridas
const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'URL de tu proyecto de Supabase',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Clave anónima pública de Supabase',
  'NEXT_PUBLIC_BASE_URL': 'URL base de la aplicación',
};

// Variables opcionales
const optionalVars = {
  'DIDIT_API_KEY': 'Clave API de Didit (opcional - plan gratuito)',
  'DIDIT_WORKFLOW_ID': 'ID del workflow de Didit (opcional - plan gratuito)',
  'DIDIT_WEBHOOK_SECRET': 'Secreto de Didit (opcional - plan gratuito)',
  'DIDIT_API_BASE_URL': 'URL base de la API de Didit (opcional)',
  'SUPABASE_SERVICE_ROLE_KEY': 'Clave de servicio de Supabase (opcional)',
  'NODE_ENV': 'Entorno de la aplicación (opcional)',
  'LOG_LEVEL': 'Nivel de logging (opcional)',
};

let hasErrors = false;
let hasWarnings = false;

console.log('📋 Variables Requeridas:');
console.log('========================');

for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`❌ ${key}: FALTANTE - ${description}`);
    hasErrors = true;
  }
}

console.log('\n📋 Variables Opcionales:');
console.log('========================');

for (const [key, description] of Object.entries(optionalVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`⚠️  ${key}: No configurada - ${description}`);
    hasWarnings = true;
  }
}

console.log('\n🔧 Configuración del Entorno:');
console.log('============================');

const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`🌍 Entorno: ${nodeEnv}`);

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
console.log(`🌐 URL Base: ${baseUrl}`);

const diditBaseUrl = process.env.DIDIT_API_BASE_URL || 'https://api.didit.me';
console.log(`🔗 Didit API: ${diditBaseUrl}`);

console.log('\n📝 Resumen:');
console.log('==========');

if (hasErrors) {
  console.log('❌ Hay errores en la configuración. Por favor, configura las variables faltantes.');
  console.log('💡 Copia el archivo env.example a .env.local y configura las variables requeridas.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  La configuración básica está completa, pero algunas variables opcionales no están configuradas.');
  console.log('💡 Considera configurar las variables opcionales para funcionalidad completa.');
} else {
  console.log('✅ Configuración completa y correcta.');
  console.log('🚀 El proyecto está listo para ejecutarse.');
}

console.log('\n📚 Recursos útiles:');
console.log('==================');
console.log('• Supabase: https://supabase.com/docs');
console.log('• Didit: https://didit.me/docs');
console.log('• Next.js: https://nextjs.org/docs'); 