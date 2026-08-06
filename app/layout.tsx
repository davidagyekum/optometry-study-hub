import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './analytics.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Optometry Study Hub',
  description: 'Lecture-based optometry notes, instructional figures, a Practice Hub and private device-local Progress Hub across five courses.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    title: 'Optometry Study Hub',
    description: 'Five courses with clear notes, private practice and device-local progress.',
    images: [{ url: '/og.png', width: 1680, height: 941, alt: 'Optometry Study Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optometry Study Hub',
    description: 'Five courses with clear notes, private practice and device-local progress.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
