import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**' },
    ],
    qualities: [100, 75],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.vercel.app',
      ],
    },
  },
  // Expose BACKEND_URL to server-side API routes (not the browser bundle).
  // On Vercel / hosting: set BACKEND_URL=https://your-backend-domain.com
  // This is used by /api/flights/booking-options and other server proxies.
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  },
};

export default nextConfig;
