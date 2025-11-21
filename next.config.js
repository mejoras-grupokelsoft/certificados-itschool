/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para que funcione en Netlify con App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
