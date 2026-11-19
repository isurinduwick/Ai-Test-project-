import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const fallback = Inter({ subsets: ['latin'], variable: '--font-fallback' });

export const metadata: Metadata = {
  title: 'Emerald Bay · Channel Manager',
  description: 'OTA channel manager demo for Emerald Bay',
  icons: {
    icon: '/icon-512.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fallback.variable} font-sans`}>{children}</body>
    </html>
  );
}
