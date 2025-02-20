'use client';
import React, { useState, useEffect } from 'react';
import SettingsModal from '../SettingsModal';

export default function Indexers() {
    const [indexers, setIndexers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIndexer, setCurrentIndexer] = useState(null);
    const [testStatus, setTestStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchIndexers() {
            try {
                const response = await fetch('/api/settings/indexers');
                if (!response.ok) throw new Error('Failed to fetch indexers');
                const data = await response.json();
                setIndexers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchIndexers();
    }, []);

    const handleAddOrEditIndexer = async () => {
        if (!currentIndexer.name || !currentIndexer.url || !currentIndexer.api_key) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const response = await fetch(
                currentIndexer.id
                    ? `/api/settings/indexers/${currentIndexer.id}`
                    : '/api/settings/indexers',
                {
                    method: currentIndexer.id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentIndexer),
                }
            );
            if (!response.ok) throw new Error('Failed to save indexer');
            const updatedIndexer = await response.json();

            if (currentIndexer.id) {
                setIndexers(indexers.map((i) => (i.id === updatedIndexer.id ? updatedIndexer : i)));
            } else {
                setIndexers([...indexers, updatedIndexer]);
            }

            setIsModalOpen(false);
            setCurrentIndexer(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleTestConnection = async () => {
        try {
            const response = await fetch('/api/settings/indexers/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentIndexer),
            });
            if (!response.ok) throw new Error('Test connection failed');
            setTestStatus('Connection successful!');
        } catch (err) {
            setTestStatus('Connection failed.');
        }
    };

    const handleDeleteIndexer = async (id) => {
        if (!confirm('Are you sure you want to delete this indexer?')) {
            return;
        }

        try {
            const response = await fetch(`/api/settings/indexers/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete indexer');
            }

            setIndexers(indexers.filter(indexer => indexer.id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-primary">Indexer Settings</h1>
            <p className="text-text-secondary">
                Configure your indexers below. At te moment, only Prowlarr is supported. This may change in the future.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {indexers.map((indexer) => (
                    <div
                        key={indexer.id}
                        className="bg-card rounded-lg shadow-md p-6 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-text-primary">{indexer.name}</h2>
                            <span
                                className={`px-2 py-1 text-sm rounded ${
                                    indexer.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}
                            >
                                {indexer.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <p className="text-sm text-text-secondary break-all">
                            <strong>URL:</strong> {indexer.url}
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => {
                                    setCurrentIndexer(indexer);
                                    setIsModalOpen(true);
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteIndexer(indexer.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Indexer Card */}
                <div
                    onClick={() => {
                        setCurrentIndexer({ name: '', url: '', api_key: '', enabled: true });
                        setIsModalOpen(true);
                    }}
                    className="border-2 border-dashed border-text-secondary rounded-lg flex items-center justify-center p-6 cursor-pointer hover:border-text-primary"
                >
                    <span className="text-text-secondary">+ Add Indexer</span>
                </div>
            </div>

            <SettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentIndexer?.id ? 'Edit Indexer' : 'Add Indexer'}
                onSave={handleAddOrEditIndexer}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Indexer Name *</label>
                        <input
                            type="text"
                            value={currentIndexer?.name || ''}
                            onChange={(e) => setCurrentIndexer({ ...currentIndexer, name: e.target.value })}
                            placeholder="e.g., Prowlarr"
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">URL *</label>
                        <input
                            type="text"
                            value={currentIndexer?.url || ''}
                            onChange={(e) => setCurrentIndexer({ ...currentIndexer, url: e.target.value })}
                            placeholder="e.g., http://192.168.1.2:9696"
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">API Key *</label>
                        <input
                            type="text"
                            value={currentIndexer?.api_key || ''}
                            onChange={(e) => setCurrentIndexer({ ...currentIndexer, api_key: e.target.value })}
                            placeholder="Enter API Key"
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleTestConnection}
                            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
                        >
                            Test Connection
                        </button>
                    </div>
                </div>
                {testStatus && (
                    <p className={`text-sm mt-2 ${testStatus === 'Connection successful!' ? 'text-green-400' : 'text-red-400'}`}>
                        {testStatus}
                    </p>
                )}
            </SettingsModal>
        </div>
    );
}