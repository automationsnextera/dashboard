/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/dashboard',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this block to ignore server-side API paths during static export
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [...(config.externals || []), 'vapi'];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=()',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
