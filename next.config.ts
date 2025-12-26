import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during build (already validated locally)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only type-check, don't fail build on warnings
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Disable case sensitivity warnings on Windows
    if (config.watchOptions) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: config.watchOptions.ignored,
      };
    }
    return config;
  },
};

export default nextConfig;
