import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude @xenova/transformers from server-side bundling
      config.externals = config.externals || [];
      config.externals.push({
        '@xenova/transformers': 'commonjs @xenova/transformers'
      });
    }
    
    // Fallback for node modules
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
  
  experimental: {
    // Tell Next.js to treat this as an external package on the server
    serverComponentsExternalPackages: ['@xenova/transformers', 'sharp', 'onnxruntime-node'],
  },
};

export default nextConfig;