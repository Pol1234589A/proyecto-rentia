import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    ignoreBuildErrors: true,
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
