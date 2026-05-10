/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  typescript: {
    // Desativa a checagem de tipos pesada no build (opcional, mas economiza RAM)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Desativa o lint no build para ser mais rápido
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
