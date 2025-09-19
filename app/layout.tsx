import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
    title: 'Jelly Wall',
    description: 'Throw jelly at the wall and see what sticks — brainstorm and develop hackathon pitches for South Florida.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased bg-jelly-body text-white min-h-screen">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

