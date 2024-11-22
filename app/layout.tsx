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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={`${inter.className} text-[16px]`}>
        <Navigation />
        <div className="md:pl-20 pt-0 md:pt-0 pb-16 md:pb-0">{children}</div>
      </body>
    </html>
  );
}
