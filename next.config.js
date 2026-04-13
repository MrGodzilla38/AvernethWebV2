const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
  return [
//    {
//      source: '/api/minecraft/:path*/',
//      destination: '/api/minecraft/:path*/',
//    },
//    {
//      source: '/api/minecraft/:path*',
//      destination: '/api/minecraft/:path*',
//    },
    {
      source: '/api/:path*/',
      destination: 'http://localhost:3001/api/:path*/',
    },
  ];
},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
}

module.exports = nextConfig
