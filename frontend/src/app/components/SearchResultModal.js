'use client';
import { useState, useEffect } from 'react';

export default function SearchResultModal({ game, isOpen, onClose, onAddGame }) {
    const [rootFolders, setRootFolders] = useState([]);
    const [selectedRootFolder, setSelectedRootFolder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchRootFolders() {
            try {
                setLoading(true);
                const response = await fetch('/api/settings/root-folders');
                if (!response.ok) throw new Error('Failed to fetch root folders');
                const data = await response.json();
                
                setRootFolders(data);
                if (data.length > 0) {
                    setSelectedRootFolder(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch root folders:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (isOpen) {
            fetchRootFolders();
        }
    }, [isOpen]);

    // Format the free space display
    const formatFreeSpace = (gb) => {
        if (gb === null || gb === undefined) return 'Unknown space';
        if (gb >= 1024) {
            return `${(gb / 1024).toFixed(1)} TB free`;
        }
        return `${Math.floor(gb)} GB free`;
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: game.name,
            release_date: game.releaseDate,
            description: game.description,
            metadata: {
                genres: game.genres,
                platforms: game.platforms,
                developers: game.developers,
                publishers: game.publishers,
                rating: game.rating,
                gameModes: game.gameModes,
                screenshots: game.screenshots,
                description: game.description,
                releaseYear: game.releaseDate ? new Date(game.releaseDate).getFullYear() : null
            },
            destination_path: `${rootFolders.find(folder => folder.id === selectedRootFolder).path}/${game.name}`,
            root_folder_id: selectedRootFolder,
            cover_url: game.cover_url,
            should_search: formData.get('should_search') === 'on'
        };
        onAddGame(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-3xl w-full m-4">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Game Cover and Metadata */}
                        <div className="space-y-4">
                            {/* Game Cover */}
                            <div className="flex justify-center">
                                {game.cover_url ? (
                                    <img
                                        src={game.cover_url}
                                        alt={game.name}
                                        className="w-48 h-auto rounded shadow-md"
                                    />
                                ) : (
                                    <div className="w-48 h-64 bg-gray-700 flex items-center justify-center rounded shadow-md">
                                        <span className="text-gray-400">No Image</span>
                                    </div>
                                )}
                            </div>

                            {/* Metadata Section */}
                            <div className="space-y-4">
                                {/* Release Year */}
                                {game.releaseDate && (
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-calendar-alt text-text-secondary shrink-0" />
                                        <span className="bg-gray-700 text-white px-2 py-1 rounded-md text-xs">
                                            {new Date(game.releaseDate).getFullYear()}
                                        </span>
                                    </div>
                                )}

                                {/* Platforms */}
                                {game.platforms && game.platforms.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <i className="fas fa-gamepad text-text-secondary shrink-0" />
                                            <span className="text-sm font-semibold text-text-secondary">Platforms</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {game.platforms.map((platform, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-700 text-white px-2 py-1 rounded-md text-xs"
                                                >
                                                    {platform}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Genres */}
                                {game.genres && game.genres.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <i className="fas fa-tags text-text-secondary shrink-0" />
                                            <span className="text-sm font-semibold text-text-secondary">Genres</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {game.genres.map((genre, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-700 text-white px-2 py-1 rounded-md text-xs"
                                                >
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Developers */}
                                {game.developers && game.developers.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <i className="fas fa-code text-text-secondary shrink-0" />
                                            <span className="text-sm font-semibold text-text-secondary">Developers</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {game.developers.map((developer, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gray-700 text-white px-2 py-1 rounded-md text-xs"
                                                >
                                                    {developer}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Game Details and Form */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-text-primary">{game.name}</h2>
                            <p className="text-sm text-text-secondary">
                                {game.description || 'No description available.'}
                            </p>

                            {/* Root Folder Selection */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">
                                    Destination Root Folder
                                </label>
                                {loading ? (
                                    <div className="text-sm text-text-secondary">Loading folders...</div>
                                ) : error ? (
                                    <div className="text-sm text-red-500">{error}</div>
                                ) : (
                                    <select
                                        value={selectedRootFolder || ''}
                                        onChange={(e) => setSelectedRootFolder(Number(e.target.value))}
                                        className="w-full bg-gray-800 text-white p-2 rounded"
                                    >
                                        {rootFolders.map((folder) => (
                                            <option key={folder.id} value={folder.id}>
                                                {folder.path} ({formatFreeSpace(folder.free_space)})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Search Checkbox */}
                            <div>
                                <label className="flex items-center text-sm text-text-secondary">
                                    <input
                                        type="checkbox"
                                        name="should_search"
                                        className="mr-2"
                                    />
                                    Search for game
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-grow bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
                                >
                                    Add to Library
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-grow bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}