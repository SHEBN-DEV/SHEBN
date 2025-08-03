/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
  // Configuración para Vercel
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
