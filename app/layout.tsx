import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OPT 376 Eye Anatomy Review',
  description: 'Clear OPT 376 study notes and 150 practice questions covering ocular adnexa, transparent media and ocular blood supply.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    title: 'OPT 376 Eye Anatomy Review',
    description: 'Study smarter. Test your understanding.',
    images: [{ url: '/og.png', width: 1680, height: 941, alt: 'OPT 376 Eye Anatomy Review' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OPT 376 Eye Anatomy Review',
    description: 'Study smarter. Test your understanding.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
