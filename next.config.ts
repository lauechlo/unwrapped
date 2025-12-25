import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
