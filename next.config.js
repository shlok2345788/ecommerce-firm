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
    const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');

    return backendUrl
      ? {
          beforeFiles: [
            { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
          ],
        }
      : { beforeFiles: [] };
  },
};

module.exports = nextConfig;
