/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  output: 'standalone',
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;