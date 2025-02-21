import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function IndexerModal({ isOpen, onClose, onSave, onTest, currentIndexer }) {
    const [indexer, setIndexer] = useState(currentIndexer || {});
    const [testStatus, setTestStatus] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestStatus(null);
        const success = await onTest(indexer);
        setIsTesting(false);
        setTestStatus(success ? 'success' : 'fail');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                    {indexer.id ? 'Edit Indexer' : 'Add New Indexer'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={indexer.name || ''}
                            onChange={(e) => {
                                setIndexer({ ...indexer, name: e.target.value });
                                setTestStatus(null); // Reset test status
                            }}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            URL *
                        </label>
                        <input
                            type="text"
                            value={indexer.url || ''}
                            onChange={(e) => {
                                setIndexer({ ...indexer, url: e.target.value });
                                setTestStatus(null); // Reset test status
                            }}
                            className="bg-card border border-border-dark text-text-primary p-2 w-full rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">
                            API Key *
                        </label>
                        <input
                            type="password"
                            value={indexer.api_key || ''} // Use `api_key` to match backend
                            onChange={(e) => {
                                setIndexer({ ...indexer, api_key: e.target.value }); // Update `api_key`
                                setTestStatus(null); // Reset test status
                            }}
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
                        onClick={() => onSave(indexer)}
                        className="px-4 py-2 bg-[#6366f1] text-white rounded hover:bg-[#4f51d9]"
                    >
                        {indexer.id ? 'Save Changes' : 'Add Indexer'}
                    </button>
                </div>
            </div>
        </div>
    );
}