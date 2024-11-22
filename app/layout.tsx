import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI YouTube Summarizer',
  description: 'Get quick AI-powered summaries of YouTube videos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <div className="pb-16 md:pt-16 md:pb-0">{children}</div>
      </body>
    </html>
  );
}
