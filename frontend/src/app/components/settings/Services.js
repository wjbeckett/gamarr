'use client';
import React, { useState, useEffect } from 'react';
import SettingsModal from '../SettingsModal';

export default function Services() {
    const [indexers, setIndexers] = useState([]);
    const [downloadClients, setDownloadClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [serviceType, setServiceType] = useState(null); // 'indexer' or 'download_client'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchServices() {
            try {
                const [indexersResponse, clientsResponse] = await Promise.all([
                    fetch('/api/settings/indexers'),
                    fetch('/api/settings/download-clients'),
                ]);

                if (!indexersResponse.ok || !clientsResponse.ok) {
                    throw new Error('Failed to fetch services');
                }

                const indexersData = await indexersResponse.json();
                const clientsData = await clientsResponse.json();

                setIndexers(indexersData);
                setDownloadClients(clientsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchServices();
    }, []);

    const handleAddOrEditService = async () => {
        if (!currentService.name || !currentService.url) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const endpoint =
                serviceType === 'indexer'
                    ? `/api/settings/indexers${currentService.id ? `/${currentService.id}` : ''}`
                    : `/api/settings/download-clients${currentService.id ? `/${currentService.id}` : ''}`;

            const method = currentService.id ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentService),
            });

            if (!response.ok) throw new Error('Failed to save service');

            const updatedService = await response.json();

            if (serviceType === 'indexer') {
                setIndexers((prev) =>
                    currentService.id
                        ? prev.map((i) => (i.id === updatedService.id ? updatedService : i))
                        : [...prev, updatedService]
                );
            } else {
                setDownloadClients((prev) =>
                    currentService.id
                        ? prev.map((c) => (c.id === updatedService.id ? updatedService : c))
                        : [...prev, updatedService]
                );
            }

            setIsModalOpen(false);
            setCurrentService(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteService = async (id, type) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const endpoint =
                type === 'indexer'
                    ? `/api/settings/indexers/${id}`
                    : `/api/settings/download-clients/${id}`;

            const response = await fetch(endpoint, { method: 'DELETE' });

            if (!response.ok) throw new Error('Failed to delete service');

            if (type === 'indexer') {
                setIndexers((prev) => prev.filter((i) => i.id !== id));
            } else {
                setDownloadClients((prev) => prev.filter((c) => c.id !== id));
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading services...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-primary">Services</h1>
            <p className="text-text-secondary">
                Configure your indexers and download clients below.
            </p>

            {/* Indexers Section */}
            <div>
                <h2 className="text-xl font-semibold text-text-primary">Indexers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {indexers.map((indexer) => (
                        <div
                            key={indexer.id}
                            className="bg-card rounded-lg shadow-md p-6 space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-text-primary">
                                    {indexer.name}
                                </h3>
                                <span
                                    className={`px-2 py-1 text-sm rounded ${
                                        indexer.enabled
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
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
                                        setCurrentService(indexer);
                                        setServiceType('indexer');
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-[#6366f1] text-white px-4 py-2 rounded hover:bg-[#4f51d9]"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteService(indexer.id, 'indexer')}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Download Clients Section */}
            <div>
                <h2 className="text-xl font-semibold text-text-primary">Download Clients</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {downloadClients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-card rounded-lg shadow-md p-6 space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-text-primary">
                                    {client.name}
                                </h3>
                                <span
                                    className={`px-2 py-1 text-sm rounded ${
                                        client.enabled
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}
                                >
                                    {client.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary break-all">
                                <strong>Type:</strong> {client.type}
                            </p>
                            <p className="text-sm text-text-secondary break-all">
                                <strong>URL:</strong> {client.url}
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => {
                                        setCurrentService(client);
                                        setServiceType('download_client');
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-[#6366f1] text-white px-4 py-2 rounded hover:bg-[#4f51d9]"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteService(client.id, 'download_client')}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Service Modal */}
            <SettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentService?.id ? 'Edit Service' : 'Add Service'}
                onSave={handleAddOrEditService}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={currentService?.name || ''}
                            onChange={(e) =>
                                setCurrentService({ ...currentService, name: e.target.value })
                            }
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            URL *
                        </label>
                        <input
                            type="text"
                            value={currentService?.url || ''}
                            onChange={(e) =>
                                setCurrentService({ ...currentService, url: e.target.value })
                            }
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    {serviceType === 'download_client' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Type
                                </label>
                                <input
                                    type="text"
                                    value={currentService?.type || ''}
                                    onChange={(e) =>
                                        setCurrentService({ ...currentService, type: e.target.value })
                                    }
                                    className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    API Key
                                </label>
                                <input
                                    type="text"
                                    value={currentService?.api_key || ''}
                                    onChange={(e) =>
                                        setCurrentService({ ...currentService, api_key: e.target.value })
                                    }
                                    className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                                />
                            </div>
                        </>
                    )}
                </div>
            </SettingsModal>
        </div>
    );
}