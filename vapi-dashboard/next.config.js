/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
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
        ];
    },
};

module.exports = nextConfig;

