'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const SettingsPage = ({ children }) => {
    const router = useRouter();

    return (
        <div className="flex h-full">
            {/* Side Menu */}
            <aside className="w-1/4 bg-gray-800 text-white p-4">
              <h2 className="text-lg font-bold mb-4">Settings</h2>
              <ul className="space-y-2">
                  <li>
                      <button
                          onClick={() => router.push('/settings/general')}
                          className="w-full text-left hover:bg-gray-700 p-2 rounded"
                      >
                          General
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => router.push('/settings/library')}
                          className="w-full text-left hover:bg-gray-700 p-2 rounded"
                      >
                          Library
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => router.push('/settings/indexers')}
                          className="w-full text-left hover:bg-gray-700 p-2 rounded"
                      >
                          Indexers
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => router.push('/settings/download-clients')}
                          className="w-full text-left hover:bg-gray-700 p-2 rounded"
                      >
                          Download Clients
                      </button>
                  </li>
                  <li>
                      <button
                          onClick={() => router.push('/settings/metadata')}
                          className="w-full text-left hover:bg-gray-700 p-2 rounded"
                      >
                          Metadata
                      </button>
                  </li>
              </ul>
          </aside>

            {/* Content Area */}
            <main className="w-3/4 p-6 bg-gray-100">{children}</main>
        </div>
    );
};

export default SettingsPage;