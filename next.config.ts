import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Asegurar que PDFs y assets estáticos se incluyan en el bundle
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Incluir PDFs en el bundle de servidor
      config.module.rules.push({
        test: /\.pdf$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/[name][ext]',
        },
      });
    }
    return config;
  },
};

export default nextConfig;
