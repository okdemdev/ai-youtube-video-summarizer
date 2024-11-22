'use client';

import Link from 'next/link';
import { Home, BookMarked } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed md:top-0 bottom-0 md:bottom-auto left-0 right-0 bg-white/80 backdrop-blur-md border-t md:border-t-0 md:border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center h-16">
          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-6 md:px-4 py-2 rounded-lg transition-all ${
                pathname === '/'
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs md:text-sm">Home</span>
            </Link>
            <Link
              href="/saved"
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-6 md:px-4 py-2 rounded-lg transition-all ${
                pathname === '/saved'
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-100'
              }`}
            >
              <BookMarked className="w-5 h-5" />
              <span className="text-xs md:text-sm">Library</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
