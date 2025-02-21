import React from 'react';

export default function DownloadClientTypeModal({ isOpen, onClose, onSelect }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Add Download Client</h2>
                <p className="text-text-secondary mb-6">
                    Select the type of download client you want to add:
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => onSelect('sabnzbd')}
                        className="w-full bg-card border border-border-dark text-text-primary p-4 rounded-lg hover:bg-gray-700 flex items-center justify-between"
                    >
                        <span>SABnzbd</span>
                        <span className="text-text-secondary text-sm">Usenet</span>
                    </button>
                    <button
                        onClick={() => onSelect('qbittorrent')}
                        className="w-full bg-card border border-border-dark text-text-primary p-4 rounded-lg hover:bg-gray-700 flex items-center justify-between"
                    >
                        <span>qBittorrent</span>
                        <span className="text-text-secondary text-sm">Torrent</span>
                    </button>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-text-secondary rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}