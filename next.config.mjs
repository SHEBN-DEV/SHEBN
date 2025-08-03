/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de seguridad para Web3
  poweredByHeader: false,
  compress: true,
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configuración de imágenes seguras
  images: {
    domains: ['verification.didit.me'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configuración actualizada para Next.js 15
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default nextConfig;
