'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function RootFoldersPage() {
  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState('');

  // Fetch root folders from the backend
  useEffect(() => {
    async function fetchFolders() {
      const response = await fetch('/api/settings/root-folders');
      const data = await response.json();
      setFolders(data);
    }
    fetchFolders();
  }, []);

  // Add a new root folder
  const handleAddFolder = async () => {
    if (!newFolder) return;
    const response = await fetch('/api/settings/root-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: newFolder }),
    });
    if (response.ok) {
      const addedFolder = await response.json();
      setFolders([...folders, { id: addedFolder.id, path: newFolder, free_space: null }]);
      setNewFolder('');
    }
  };

  // Remove a root folder
  const handleRemoveFolder = async (id) => {
    const response = await fetch(`/api/settings/root-folders/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setFolders(folders.filter((folder) => folder.id !== id));
    }
  };

  // Format the free space display
  const formatFreeSpace = (gb) => {
    if (gb === null || gb === undefined) return 'Unknown space';
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB free`;
    }
    return `${Math.floor(gb)} GB free`;
  };

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
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                Free Space
              </th>
              <th className="px-6 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {folders.map((folder) => (
              <tr key={folder.id} className="hover:bg-card-hover">
                <td className="px-6 py-4 text-sm">{folder.path}</td>
                <td className="px-6 py-4 text-sm">{formatFreeSpace(folder.free_space)}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="text-text-secondary hover:text-error"
                    onClick={() => handleRemoveFolder(folder.id)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Root Folder */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          placeholder="Enter folder path"
          className="flex-1 px-4 py-2 border rounded-md"
        />
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          onClick={handleAddFolder}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Root Folder</span>
        </button>
      </div>
    </div>
  );
}