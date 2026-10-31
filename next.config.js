/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL || 'https://ecommerce-firm.onrender.com'
    ).replace(/\/$/, '');

    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      ],
    };
  },
};

module.exports = nextConfig;
