import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  // Add environment variable configuration
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Add serverRuntimeConfig for sensitive variables
  serverRuntimeConfig: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // Add publicRuntimeConfig for public variables
  publicRuntimeConfig: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

// Add runtime environment checks
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn('Warning: Missing AUTH_SECRET or NEXTAUTH_SECRET environment variable');
}

export default nextConfig;