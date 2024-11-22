'use client';

import Link from 'next/link';
import { Home, BookMarked, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-200 flex-col items-center py-4 z-50">
        <Link href="/" className="p-3 text-primary hover:text-primary/80 transition-colors">
          <Youtube className="w-6 h-6" />
        </Link>

        <div className="flex flex-col items-center gap-2 mt-8">
          <Link
            href="/"
            className={`group relative p-3 rounded-xl transition-all ${
              pathname === '/'
                ? 'text-primary bg-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-100'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Home
            </span>
          </Link>

          <Link
            href="/saved"
            className={`group relative p-3 rounded-xl transition-all ${
              pathname === '/saved'
                ? 'text-primary bg-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-100'
            }`}
          >
            <BookMarked className="w-6 h-6" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
              Library
            </span>
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center gap-12">
            <Link
              href="/"
              className={`flex flex-col items-center gap-1 ${
                pathname === '/' ? 'text-primary' : 'text-gray-600'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </Link>
            <Link
              href="/saved"
              className={`flex flex-col items-center gap-1 ${
                pathname === '/saved' ? 'text-primary' : 'text-gray-600'
              }`}
            >
              <BookMarked className="w-6 h-6" />
              <span className="text-xs">Library</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
