/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'pino'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nemuftsdmjzkzcygkjpg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
export default nextConfig;
