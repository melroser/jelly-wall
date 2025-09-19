
import NextAuth from 'next-auth';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { authOptions } from '@/lib/auth';

const handler = NextAuth({
    ...authOptions,
    providers: [
        LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID!,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'openid profile email',
                },
            },
            issuer: 'https://www.linkedin.com',
            wellKnown: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
            profile(profile) {
                return {
                    id: profile.sub,  // Map 'sub' to 'id'
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
    ],
});

export { handler as GET, handler as POST };

