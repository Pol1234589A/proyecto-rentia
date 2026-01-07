import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
