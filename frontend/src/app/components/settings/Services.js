'use client';
import React, { useState, useEffect } from 'react';
import IndexerModal from './IndexerModal';
import DownloadClientModal from './DownloadClientModal';

export default function Services() {
    const [indexers, setIndexers] = useState([]);
    const [downloadClients, setDownloadClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [serviceType, setServiceType] = useState(null); // 'indexer' or 'download_client'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch indexers and download clients
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

    // Save service (add or edit)
    const handleSaveService = async (service) => {
        const endpoint =
            serviceType === 'indexer'
                ? `/api/settings/indexers${service.id ? `/${service.id}` : ''}`
                : `/api/settings/download-clients${service.id ? `/${service.id}` : ''}`;

        const method = service.id ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(service),
            });

            if (!response.ok) throw new Error('Failed to save service');

            const updatedService = await response.json();

            if (serviceType === 'indexer') {
                setIndexers((prev) =>
                    service.id
                        ? prev.map((i) => (i.id === updatedService.id ? updatedService : i))
                        : [...prev, updatedService]
                );
            } else {
                setDownloadClients((prev) =>
                    service.id
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

    // Test connection
    const handleTestConnection = async (service) => {
        const endpoint =
            serviceType === 'indexer'
                ? '/api/settings/indexers/test'
                : '/api/settings/download-clients/test';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(service),
            });

            return response.ok; // Return true if the connection is successful
        } catch (err) {
            return false; // Return false if the connection fails
        }
    };

    // Delete service
    const handleDeleteService = async (id, type) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        const endpoint =
            type === 'indexer'
                ? `/api/settings/indexers/${id}`
                : `/api/settings/download-clients/${id}`;

        try {
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
        <div className="space-y-8 px-6 md:px-12">
            {/* Indexers Section */}
            <div>
                <div className="border-b border-border-dark pb-4">
                    <h1 className="text-2xl font-bold text-text-primary">Indexer Settings</h1>
                    <p className="text-text-secondary">
                        Configure your Indexer server below. This is only intended for Prowlarr at
                        this point in time.
                    </p>
                </div>
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

                    {/* Add Indexer Card */}
                    <div
                        onClick={() => {
                            setCurrentService({ name: '', url: '', apiKey: '', enabled: true });
                            setServiceType('indexer');
                            setIsModalOpen(true);
                        }}
                        className="border-2 border-dashed border-text-secondary rounded-lg flex items-center justify-center p-6 cursor-pointer hover:border-text-primary"
                    >
                        <span className="text-text-secondary">+ Add Indexer</span>
                    </div>
                </div>
            </div>

            {/* Download Clients Section */}
            <div>
                <div className="border-b border-border-dark pb-4">
                    <h1 className="text-2xl font-bold text-text-primary">Download Client Settings</h1>
                    <p className="text-text-secondary">
                        Configure your Download Clients below. At this point in time, only certain
                        Torrent clients are supported.
                    </p>
                </div>
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

                    {/* Add Download Client Card */}
                    <div
                        onClick={() => {
                            setCurrentService({
                                name: '',
                                host: '',
                                port: '',
                                useSSL: false,
                                username: '',
                                password: '',
                                category: '',
                                initialState: '',
                                tags: '',
                                enabled: true,
                            });
                            setServiceType('download_client');
                            setIsModalOpen(true);
                        }}
                        className="border-2 border-dashed border-text-secondary rounded-lg flex items-center justify-center p-6 cursor-pointer hover:border-text-primary"
                    >
                        <span className="text-text-secondary">+ Add Download Client</span>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {serviceType === 'indexer' && (
                <IndexerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveService}
                    onTest={handleTestConnection}
                    currentIndexer={currentService}
                />
            )}
            {serviceType === 'download_client' && (
                <DownloadClientModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveService}
                    onTest={handleTestConnection}
                    currentClient={currentService}
                />
            )}
        </div>
    );
}