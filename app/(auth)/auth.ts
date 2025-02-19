import NextAuth, { type Session, type User } from 'next-auth';
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getUser, createUser } from '@/lib/db/queries';

interface ExtendedSession extends Session {
  user: User;
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable');
}

if (!process.env.AUTH_MICROSOFT_ENTRA_ID_ID || 
    !process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET || 
    !process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER) {
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
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Automatically create a local user record if it doesn't exist.
      const existingUser = await getUser(user.email!);
      console.log('existingUser', existingUser);
      if (existingUser.length === 0) {
        console.log('creating user');
        const [newUser] = await createUser(user.email!, '');
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
