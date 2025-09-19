import type { NextAuthOptions } from 'next-auth';

export const authOptions: Partial<NextAuthOptions> = {
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token }) {
            return token;
        },
        async session({ session, token }) {
            if (token?.sub) {
                (session.user as { id?: string }).id = token.sub;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
