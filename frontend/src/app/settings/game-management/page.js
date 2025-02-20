'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function MediaManagementPage() {
    const [folders, setFolders] = useState([]);
    const [newFolder, setNewFolder] = useState('');
    const [defaultFolder, setDefaultFolder] = useState('');

    // Fetch root folders and default library location
    useEffect(() => {
        async function fetchData() {
            const rootFoldersResponse = await fetch('/api/settings/root-folders');
            const rootFoldersData = await rootFoldersResponse.json();
            setFolders(rootFoldersData);

            const generalSettingsResponse = await fetch('/api/settings/general');
            const generalSettingsData = await generalSettingsResponse.json();
            const defaultLocation = generalSettingsData.find(
                (setting) => setting.key === 'default_library_location'
            );
            setDefaultFolder(defaultLocation?.value || '');
        }

        fetchData();
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
            const updatedFolders = await response.json();
            setFolders(updatedFolders);
            setNewFolder('');
        }
    };

    // Remove a root folder
    const handleRemoveFolder = async (id) => {
        if (!confirm('Are you sure you want to remove this folder?')) return;
        const response = await fetch(`/api/settings/root-folders/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            setFolders(folders.filter((folder) => folder.id !== id));
        }
    };

    // Save the default library location
    const handleSaveDefaultFolder = async () => {
        await fetch('/api/settings/general', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'default_library_location', value: defaultFolder }),
        });
        alert('Default library location saved!');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="border-b border-border-dark pb-4">
                <h1 className="text-2xl font-bold text-text-primary">Game Management</h1>
                <p className="text-text-secondary">
                    Configure your game library settings, including root folders and file management options.
                </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
                {/* Root Folders Section */}
                <section className="bg-card rounded-lg p-6 space-y-6">
                    <h2 className="text-lg font-semibold border-b border-border-dark pb-2">
                        Game Locations
                    </h2>
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
                                        <td className="px-6 py-4 text-sm">
                                            {folder.free_space ? `${folder.free_space} GB` : 'Unknown'}
                                        </td>
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
                            className="flex-1 px-4 py-2 border rounded-md bg-card text-text-primary"
                        />
                        <button
                            className="flex items-center space-x-2 px-4 py-2 bg-[#6366f1] text-white rounded-md hover:bg-[#4f51d9] transition-colors"
                            onClick={handleAddFolder}
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Add Root Folder</span>
                        </button>
                    </div>
                </section>

                {/* Default Library Location Selector */}
                <section className="bg-card rounded-lg p-6 space-y-6">
                    <h2 className="text-lg font-semibold border-b border-border-dark pb-2">
                        Default Library Location
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            Select Default Location
                        </label>
                        <select
                            value={defaultFolder}
                            onChange={(e) => setDefaultFolder(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-md bg-card text-text-primary"
                        >
                            <option value="">Select a folder</option>
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.path}>
                                    {folder.path}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleSaveDefaultFolder}
                        className="px-4 py-2 bg-[#6366f1] text-white rounded-md hover:bg-[#4f51d9] transition-colors"
                    >
                        Save
                    </button>
                </section>

                {/* Game Naming Section */}
                <section className="bg-card rounded-lg p-6 space-y-6">
                    <h2 className="text-lg font-semibold border-b border-border-dark pb-2">
                        Game Naming
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <div className="flex-1">
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" className="rounded border-gray-400" />
                                    <span>Rename Games</span>
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    Gamarr will use the existing file name if renaming is disabled.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="flex-1">
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" className="rounded border-gray-400" />
                                    <span>Replace Illegal Characters</span>
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    Replace illegal characters. If unchecked, Gamarr will remove them instead.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* File Management Section */}
                <section className="bg-card rounded-lg p-6 space-y-6">
                    <h2 className="text-lg font-semibold border-b border-border-dark pb-2">
                        File Management
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <div className="flex-1">
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" className="rounded border-gray-400" />
                                    <span>Unmonitor Deleted Games</span>
                                </label>
                                <p className="text-sm text-text-secondary mt-1">
                                    Games deleted from disk are automatically unmonitored in Gamarr.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}