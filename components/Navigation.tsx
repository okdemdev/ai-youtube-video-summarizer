'use client';

import Link from 'next/link';
import { Home, BookMarked } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:top-0 md:bottom-auto shadow-lg md:shadow-sm z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-center gap-8">
        <Link
          href="/"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            pathname === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Home</span>
        </Link>
        <Link
          href="/saved"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            pathname === '/saved' ? 'text-primary' : 'text-gray-600 hover:text-primary'
          }`}
        >
          <BookMarked className="w-5 h-5" />
          <span className="font-medium">Saved</span>
        </Link>
      </div>
    </nav>
  );
}
