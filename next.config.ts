import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rentiaroom.com',
      },
      {
        protocol: 'https',
        hostname: 'www.rentiaroom.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api-rentger/:path*',
        destination: 'https://api.rentger.com/:path*',
      },
    ];
  },
};

export default nextConfig;
