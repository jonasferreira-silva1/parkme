/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Proxy reverso: chamadas do browser para /api-proxy/* são
  // redirecionadas para o container da API dentro da rede Docker.
  // No browser, continua usando localhost:3000 diretamente.
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${process.env.API_INTERNAL_URL ?? 'http://api:3000'}/:path*`,
      },
    ]
  },
}

export default nextConfig
