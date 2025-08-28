import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Use JWT sessions; no DB adapter required
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/search`;
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 