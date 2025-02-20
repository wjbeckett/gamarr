'use client';
import React, { useState, useEffect } from 'react';
import SettingsCard from '../SettingsCard';
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

    return (
        <div>
            <div className="space-y-4">
                {indexers.map((indexer) => (
                    <SettingsCard
                        key={indexer.id}
                        title={indexer.name}
                        details={`Status: ${indexer.enabled ? 'Enabled' : 'Disabled'}`}
                        onEdit={() => {
                            setCurrentIndexer(indexer);
                            setIsModalOpen(true);
                        }}
                        onDelete={() => handleDeleteIndexer(indexer.id)}
                    />
                ))}
            </div>
            <button
                onClick={() => {
                    setCurrentIndexer({ name: '', url: '', api_key: '', enabled: true });
                    setIsModalOpen(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4"
            >
                Add Indexer
            </button>

            <SettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentIndexer?.id ? 'Edit Indexer' : 'Add Indexer'}
                onSave={handleAddOrEditIndexer}
            >
                <div className="space-y-4">
                    <input
                        type="text"
                        value={currentIndexer?.name || ''}
                        onChange={(e) => setCurrentIndexer({ ...currentIndexer, name: e.target.value })}
                        placeholder="Name"
                        className="border p-2 w-full"
                    />
                    <input
                        type="text"
                        value={currentIndexer?.url || ''}
                        onChange={(e) => setCurrentIndexer({ ...currentIndexer, url: e.target.value })}
                        placeholder="URL"
                        className="border p-2 w-full"
                    />
                    <input
                        type="text"
                        value={currentIndexer?.api_key || ''}
                        onChange={(e) => setCurrentIndexer({ ...currentIndexer, api_key: e.target.value })}
                        placeholder="API Key"
                        className="border p-2 w-full"
                    />
                    <button
                        onClick={handleTestConnection}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
                    >
                        Test Connection
                    </button>
                    {testStatus && <p className="text-sm text-gray-600">{testStatus}</p>}
                </div>
            </SettingsModal>
        </div>
    );
}