/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components
  serverExternalPackages: ['fixdescriptorkit-typescript'],
  
  // Webpack configuration for monorepo
  webpack: (config) => {
    // Handle local packages
    config.resolve.symlinks = false;
    
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;
