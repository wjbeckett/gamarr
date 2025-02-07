'use client';
import { useState, useEffect } from 'react';

export default function GeneralSettings() {
  const [rootFolders, setRootFolders] = useState([]);
  const [defaultFolder, setDefaultFolder] = useState('');

  useEffect(() => {
    async function fetchRootFolders() {
      const response = await fetch('/api/settings/root-folders');
      const data = await response.json();
      setRootFolders(data);
    }
    fetchRootFolders();
  }, []);

  const handleSave = async () => {
    await fetch('/api/settings/general', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'default_library_location', value: defaultFolder }),
    });
    alert('Default library location saved!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">General Settings</h1>
      <div>
        <label className="block text-sm font-medium">Default Library Location</label>
        <select
          value={defaultFolder}
          onChange={(e) => setDefaultFolder(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select a folder</option>
          {rootFolders.map((folder) => (
            <option key={folder.id} value={folder.path}>
              {folder.path}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
      >
        Save
      </button>
    </div>
  );
}