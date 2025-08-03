#!/bin/bash

# Script de build para Vercel
echo "🚀 Iniciando build de SHEBN..."

# Verificar variables de entorno críticas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  ADVERTENCIA: NEXT_PUBLIC_SUPABASE_URL no está configurada"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  ADVERTENCIA: NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada"
fi

if [ -z "$NEXT_PUBLIC_BASE_URL" ]; then
    echo "⚠️  ADVERTENCIA: NEXT_PUBLIC_BASE_URL no está configurada"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar build
echo "🔨 Ejecutando build..."
npm run build

echo "✅ Build completado" 