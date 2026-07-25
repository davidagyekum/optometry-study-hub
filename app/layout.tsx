import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Optometry Study Hub',
  description: 'Lecture-based optometry study notes, instructional figures and 400 practice questions across five courses.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    title: 'Optometry Study Hub',
    description: 'Five courses. Clear notes. 400 practice questions.',
    images: [{ url: '/og.png', width: 1680, height: 941, alt: 'Optometry Study Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optometry Study Hub',
    description: 'Five courses. Clear notes. 400 practice questions.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
