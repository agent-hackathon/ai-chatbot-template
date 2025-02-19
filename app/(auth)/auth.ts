import NextAuth, { type Session, type User } from 'next-auth';
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getUser, createUser } from '@/lib/db/queries';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

interface ExtendedSession extends Session {
  user: User;
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable');
}

if (!serverRuntimeConfig.AUTH_MICROSOFT_ENTRA_ID_ID || 
  !serverRuntimeConfig.AUTH_MICROSOFT_ENTRA_ID_SECRET || 
  !serverRuntimeConfig.AUTH_MICROSOFT_ENTRA_ID_ISSUER) {
throw new Error('Missing Microsoft Entra ID environment variables');
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    MicrosoftEntraID({
      clientId: serverRuntimeConfig.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: serverRuntimeConfig.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: serverRuntimeConfig.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }
      // Automatically create a local user record if it doesn't exist.
      const existingUser = await getUser(user.email);
      if (existingUser.length === 0) {
        console.log('creating user');
        const [newUser] = await createUser(user.email, '');
        user.id = newUser.id;
      } else {
        user.id = existingUser[0].id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
