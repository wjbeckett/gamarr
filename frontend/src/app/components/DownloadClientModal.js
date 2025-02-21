import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function DownloadClientModal({ isOpen, onClose, onSave, onTest, currentClient, clientType }) {
    const [client, setClient] = useState(currentClient || {});
    const [testStatus, setTestStatus] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestStatus(null);
        const success = await onTest(client);
        setIsTesting(false);
        setTestStatus(success ? 'success' : 'fail');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-2xl flex flex-col">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                    {client.id ? `Edit Download Client - ${clientType}` : `Add Download Client - ${clientType}`}
                </h2>
                <div className="overflow-y-auto flex-grow space-y-6 pr-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Name *</label>
                        <input
                            type="text"
                            value={client.name || ''}
                            onChange={(e) => setClient({ ...client, name: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Host *</label>
                        <input
                            type="text"
                            value={client.host || ''}
                            onChange={(e) => setClient({ ...client, host: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Port *</label>
                        <input
                            type="number"
                            value={client.port || ''}
                            onChange={(e) => setClient({ ...client, port: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={client.useSSL || false}
                            onChange={(e) => setClient({ ...client, useSSL: e.target.checked })}
                            className="form-checkbox text-indigo-600"
                        />
                        <label className="text-sm font-medium text-text-secondary">Use SSL</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Username</label>
                        <input
                            type="text"
                            value={client.username || ''}
                            onChange={(e) => setClient({ ...client, username: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Password</label>
                        <input
                            type="password"
                            value={client.password || ''}
                            onChange={(e) => setClient({ ...client, password: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Category</label>
                        <input
                            type="text"
                            value={client.category || ''}
                            onChange={(e) => setClient({ ...client, category: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Initial State</label>
                        <input
                            type="text"
                            value={client.initialState || ''}
                            onChange={(e) => setClient({ ...client, initialState: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Tags</label>
                        <input
                            type="text"
                            value={client.tags || ''}
                            onChange={(e) => setClient({ ...client, tags: e.target.value })}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-text-secondary rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTestConnection}
                        className={`px-4 py-2 rounded flex items-center space-x-2 ${
                            isTesting
                                ? 'bg-gray-500 text-white'
                                : testStatus === 'success'
                                ? 'bg-green-500 text-white'
                                : testStatus === 'fail'
                                ? 'bg-red-500 text-white'
                                : 'bg-[#6366f1] text-white hover:bg-[#4f51d9]'
                        }`}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : testStatus === 'success' ? (
                            <CheckIcon className="h-5 w-5" />
                        ) : testStatus === 'fail' ? (
                            <XMarkIcon className="h-5 w-5" />
                        ) : null}
                        <span>
                            {isTesting
                                ? 'Testing...'
                                : testStatus === 'success'
                                ? 'Successful'
                                : testStatus === 'fail'
                                ? 'Failed'
                                : 'Test'}
                        </span>
                    </button>
                    <button
                        onClick={() => onSave(client)}
                        className="px-4 py-2 bg-[#6366f1] text-white rounded hover:bg-[#4f51d9]"
                    >
                        {client.id ? 'Save Changes' : 'Add Client'}
                    </button>
                </div>
            </div>
        </div>
    );
}