'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import {
  HomeIcon,
  ClockIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    pathname.startsWith('/settings')
  );

  const isActive = (path) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Hamburger Menu Button */}
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-md bg-card hover:bg-card-hover transition-colors"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Bars3Icon className="h-6 w-6 text-text-primary" aria-hidden="true" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border-dark transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Close Button for Mobile */}
        <button
          type="button"
          className="md:hidden absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-md bg-card hover:bg-card-hover transition-colors"
          onClick={() => setIsSidebarOpen(false)}
        >
          <XMarkIcon className="h-6 w-6 text-text-primary" aria-hidden="true" />
        </button>

        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-border-dark">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size={44} />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {/* Library */}
            <li>
              <Link
                href="/"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive('/')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-card-hover hover:text-text-primary'
                }`}
                onClick={() => setIsSidebarOpen(false)} // Close sidebar on mobile
              >
                <HomeIcon className="h-5 w-5" />
                <span>Library</span>
              </Link>
            </li>

            {/* Activity */}
            <li>
              <Link
                href="/activity"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive('/activity')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-card-hover hover:text-text-primary'
                }`}
                onClick={() => setIsSidebarOpen(false)} // Close sidebar on mobile
              >
                <ClockIcon className="h-5 w-5" />
                <span>Activity</span>
              </Link>
            </li>

            {/* Settings with Sub-items */}
            <li>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                  isActive('/settings')
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-card-hover hover:text-text-primary'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span>Settings</span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${
                    isSettingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Settings Sub-menu */}
              {isSettingsOpen && (
              <ul className="ml-9 mt-2 space-y-2 border-l border-border-dark">
                  <li>
                  <Link
                      href="/settings/game-management"
                      className={`block pl-4 py-2 text-sm rounded-md transition-colors ${
                      isActive('/settings/game-management')
                          ? 'text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                  >
                      Game Management
                  </Link>
                  </li>
                  <li>
                  <Link
                      href="/settings/root-folders"
                      className={`block pl-4 py-2 text-sm rounded-md transition-colors ${
                      isActive('/settings/root-folders')
                          ? 'text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                  >
                      Root Folders
                  </Link>
                  </li>
                  <li>
                  <Link
                      href="/settings/indexers"
                      className={`block pl-4 py-2 text-sm rounded-md transition-colors ${
                      isActive('/settings/indexers')
                          ? 'text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                  >
                      Indexers
                  </Link>
                  </li>
                  <li>
                  <Link
                      href="/settings/download-clients"
                      className={`block pl-4 py-2 text-sm rounded-md transition-colors ${
                      isActive('/settings/download-clients')
                          ? 'text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                  >
                      Download Clients
                  </Link>
                  </li>
                  <li>
                  <Link
                      href="/settings/metadata"
                      className={`block pl-4 py-2 text-sm rounded-md transition-colors ${
                      isActive('/settings/metadata')
                          ? 'text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                  >
                      Metadata
                  </Link>
                  </li>
                  <li>
                  <Link
                      href="/settings/general"
                      className={`block pl-4 py-2 text-sm rounded-md transition-colors ${
                      isActive('/settings/general')
                          ? 'text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                  >
                      General
                  </Link>
                  </li>
              </ul>
            )}
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}