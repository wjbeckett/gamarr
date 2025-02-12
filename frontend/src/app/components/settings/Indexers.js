'use client';
import React, { useState, useEffect } from 'react';

export default function Indexers() {
    const [indexers, setIndexers] = useState([]);
    const [newIndexer, setNewIndexer] = useState({ name: '', url: '', api_key: '' });
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

    const handleAddIndexer = async () => {
        if (!newIndexer.name || !newIndexer.url || !newIndexer.api_key) return;
    
        try {
            const response = await fetch('/api/settings/indexers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newIndexer),
            });
            if (!response.ok) throw new Error('Failed to add indexer');
            const addedIndexer = await response.json();
    
            // Ensure the response contains the expected data
            if (!addedIndexer || !addedIndexer.id) throw new Error('Invalid response format');
            setIndexers([...indexers, addedIndexer]);
            setNewIndexer({ name: '', url: '', api_key: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteIndexer = async (id) => {
        try {
            const response = await fetch(`/api/settings/indexers/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete indexer');
            setIndexers(indexers.filter((indexer) => indexer.id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading indexers...</div>;
    if (error) return <div>Error loading indexers: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Indexers</h2>
            <ul className="mb-4">
                {indexers.map((indexer) => (
                    <li key={indexer.id} className="flex justify-between items-center mb-2">
                        <span>{indexer.name} ({indexer.url})</span>
                        <button
                            className="text-red-500"
                            onClick={() => handleDeleteIndexer(indexer.id)}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
            <div className="space-y-2">
                <input
                    type="text"
                    value={newIndexer.name}
                    onChange={(e) => setNewIndexer({ ...newIndexer, name: e.target.value })}
                    placeholder="Name"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newIndexer.url}
                    onChange={(e) => setNewIndexer({ ...newIndexer, url: e.target.value })}
                    placeholder="URL"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newIndexer.api_key}
                    onChange={(e) => setNewIndexer({ ...newIndexer, api_key: e.target.value })}
                    placeholder="API Key"
                    className="border p-2 w-full"
                />
                <button
                    onClick={handleAddIndexer}
                    className="bg-blue-500 text-white px-4 py-2 w-full"
                >
                    Add Indexer
                </button>
            </div>
        </div>
    );
}