'use client';
import React, { useState, useEffect } from 'react';

export default function DownloadClients() {
    const [clients, setClients] = useState([]);
    const [newClient, setNewClient] = useState({
        name: '',
        type: '',
        url: '',
        username: '',
        password: '',
        api_key: '',
        category: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchClients() {
            try {
                const response = await fetch('/api/settings/download-clients');
                if (!response.ok) throw new Error('Failed to fetch download clients');
                const data = await response.json();
                setClients(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchClients();
    }, []);

    const handleAddClient = async () => {
        if (!newClient.name || !newClient.type || !newClient.url) return;

        try {
            const response = await fetch('/api/settings/download-clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient),
            });
            if (!response.ok) throw new Error('Failed to add download client');
            const addedClient = await response.json();
            setClients([...clients, addedClient]);
            setNewClient({
                name: '',
                type: '',
                url: '',
                username: '',
                password: '',
                api_key: '',
                category: '',
            });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClient = async (id) => {
        try {
            const response = await fetch(`/api/settings/download-clients/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete download client');
            setClients(clients.filter((client) => client.id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading download clients...</div>;
    if (error) return <div>Error loading download clients: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Download Clients</h2>
            <ul className="mb-4">
                {clients.map((client) => (
                    <li key={client.id} className="flex justify-between items-center mb-2">
                        <span>{client.name} ({client.type})</span>
                        <button
                            className="text-red-500"
                            onClick={() => handleDeleteClient(client.id)}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
            <div className="space-y-2">
                <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Name"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newClient.type}
                    onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                    placeholder="Type (e.g., qBittorrent, NZBGet)"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newClient.url}
                    onChange={(e) => setNewClient({ ...newClient, url: e.target.value })}
                    placeholder="URL"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newClient.username}
                    onChange={(e) => setNewClient({ ...newClient, username: e.target.value })}
                    placeholder="Username (optional)"
                    className="border p-2 w-full"
                />
                <input
                    type="password"
                    value={newClient.password}
                    onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                    placeholder="Password (optional)"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newClient.api_key}
                    onChange={(e) => setNewClient({ ...newClient, api_key: e.target.value })}
                    placeholder="API Key (optional)"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={newClient.category}
                    onChange={(e) => setNewClient({ ...newClient, category: e.target.value })}
                    placeholder="Category (optional)"
                    className="border p-2 w-full"
                />
                <button
                    onClick={handleAddClient}
                    className="bg-blue-500 text-white px-4 py-2 w-full"
                >
                    Add Download Client
                </button>
            </div>
        </div>
    );
}