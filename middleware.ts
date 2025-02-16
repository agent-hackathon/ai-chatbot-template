import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/app/(auth)/auth.config';

// Add runtime validation of environment variables
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.error('Missing required environment variables in middleware');
}

const { auth } = NextAuth(authConfig);

// Export the middleware function directly
export default auth((req: NextRequest) => {
});

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};