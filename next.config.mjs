/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/thumbnail/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.usercontent.google.com',
        port: '',
        pathname: '/download/**',
      },
    ],
  },
}

export default nextConfig
