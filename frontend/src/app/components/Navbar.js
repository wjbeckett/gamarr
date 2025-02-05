'use client';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
  const pathname = usePathname();

  // Fix the "Library" link always being active
  const isActive = (path) => {
    if (pathname === path || pathname.startsWith(path + '/')) return 'text-primary';
    return 'text-text-secondary hover:text-text-primary transition-colors';
  };

  return (
    <div className="fixed top-0 z-30 w-full bg-background/95 backdrop-blur-sm border-b border-border-dark h-20">
      <div className="px-6 flex h-full items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size={44} />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className={isActive('/')}>
            Library
          </Link>
          <Link href="/activity" className={isActive('/activity')}>
            Activity
          </Link>
          <Link href="/settings" className={isActive('/settings')}>
            Settings
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden h-10 w-10 flex items-center justify-center rounded-md hover:bg-card-hover transition-colors"
        >
          <Bars3Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}