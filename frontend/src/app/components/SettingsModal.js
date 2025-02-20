import { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, title, children, onSave }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-6">
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                <div className="space-y-6">{children}</div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-text-secondary rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}