'use client';
import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function RootFoldersPage() {
  const [folders, setFolders] = useState([
    { path: '/data/games/pc', freeSpace: '126.5 GB', unmappedFolders: 3 },
    { path: '/data/games/roms', freeSpace: '126.5 GB', unmappedFolders: 1 },
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border-dark pb-4">
        <h1 className="text-2xl font-semibold">Root Folders</h1>
      </div>

      {/* Root Folders Table */}
      <div className="bg-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-card-hover">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                Path
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">
                Free Space
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">
                Unmapped Folders
              </th>
              <th className="px-6 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {folders.map((folder, index) => (
              <tr key={index} className="hover:bg-card-hover">
                <td className="px-6 py-4 text-sm">
                  {folder.path}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {folder.freeSpace}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {folder.unmappedFolders}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="text-text-secondary hover:text-error"
                    onClick={() => {/* Handle delete */}}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Root Folder Button */}
      <button
        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        onClick={() => {/* Handle add */}}
      >
        <PlusIcon className="h-5 w-5" />
        <span>Add Root Folder</span>
      </button>
    </div>
  );
}