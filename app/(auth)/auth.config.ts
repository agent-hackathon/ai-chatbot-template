import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      //console.log('🔥 authorized - Path:', nextUrl.pathname, 'Auth:', !!auth?.user);
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/chat');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        //console.log('🔥 authorized - Logged in, redirecting from login/register to /');
        return Response.redirect(new URL('/', nextUrl.origin));
      }

      if (isOnRegister || isOnLogin) {
        //console.log('🔥 authorized - Allowing access to register/login');
        return true;
      }

      if (isOnChat) {
        if (isLoggedIn) {
          //console.log('🔥 authorized - Logged in, allowing chat access');
          return true;
        }
        //console.log('🔥 authorized - Not logged in, blocking chat');
        return false;
      }

      if (isLoggedIn) {
        //console.log('🔥 authorized - Logged in, redirecting to /');
        return Response.redirect(new URL('/', nextUrl));
      }

      //console.log('🔥 authorized - Default allow');
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !=='development',
        domain: process.env.NODE_ENV === 'development' ? undefined : undefined,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 900,
      },
    },
  },
} satisfies NextAuthConfig;