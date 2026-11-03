/** @type {import('next').NextConfig} */
const backendOrigin = (process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendOrigin}/api/:path*` },
      { source: '/sanctum/:path*', destination: `${backendOrigin}/sanctum/:path*` },
    ];
  },
};

module.exports = nextConfig;
