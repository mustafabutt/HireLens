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
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Important: Do NOT proxy NextAuth routes (handled by Next.js)
    // Only proxy our backend API endpoints
    return [
      { source: '/api/search/:path*', destination: `${API}/api/search/:path*` },
      { source: '/api/upload/:path*', destination: `${API}/api/upload/:path*` },
      { source: '/api/cv/:path*', destination: `${API}/api/cv/:path*` },
    ];
  },
};

module.exports = nextConfig; 