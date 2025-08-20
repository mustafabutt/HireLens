/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables for the frontend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  
  // Image optimization settings
  images: {
    domains: ['localhost'],
  },
  
  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig; 