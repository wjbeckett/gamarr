'use client';
import { useState } from 'react';

export default function DeleteGameModal({ game, isOpen, onClose, onConfirm }) {
    const [deleteFiles, setDeleteFiles] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onConfirm(deleteFiles);
            onClose();
        } catch (error) {
            console.error('Failed to delete game:', error);
            // You might want to show an error message here
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-lg w-full m-4">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                    Remove {game.name}
                </h2>

                <div className="mb-6 text-text-secondary">
                    <p className="mb-4">
                        Are you sure you want to remove this game from your library?
                    </p>
                    
                    <div className="flex items-start space-x-2 p-4 bg-gray-800 rounded-lg">
                        <input
                            type="checkbox"
                            id="deleteFiles"
                            checked={deleteFiles}
                            onChange={(e) => setDeleteFiles(e.target.checked)}
                            className="mt-1"
                        />
                        <div>
                            <label 
                                htmlFor="deleteFiles" 
                                className="text-text-primary font-medium block mb-1"
                            >
                                Delete files from disk
                            </label>
                            {game.destination_path && (
                                <p className="text-sm text-yellow-400">
                                    This will delete all files at:
                                    <br />
                                    <span className="font-mono text-xs break-all">
                                        {game.destination_path}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? 'Removing...' : 'Remove'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}