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
    const backendUrl =
      process.env.USE_EXTERNAL_API === 'true'
        ? process.env.BACKEND_URL?.replace(/\/$/, '')
        : undefined;

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
