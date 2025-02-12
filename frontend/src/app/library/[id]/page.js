'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DeleteGameModal from '../../components/DeleteGameModal';

function FileLocationInfo({ path, libraryLocation, status, gameId }) {
    const [exists, setExists] = useState(null);
    const [versionInfo, setVersionInfo] = useState(null);

    useEffect(() => {
        async function checkPathAndVersion() {
            if (!path) return;

            try {
                // Check if path exists
                const pathResponse = await fetch(`/api/games/check-path?path=${encodeURIComponent(path)}`);
                const pathData = await pathResponse.json();
                setExists(pathData.exists);

                if (pathData.exists && gameId) {
                    // Fetch version information
                    const versionResponse = await fetch(`/api/games/${gameId}/version`);
                    const versionData = await versionResponse.json();
                    setVersionInfo(versionData);
                }
            } catch (error) {
                console.error('Failed to check path or version:', error);
                setExists(false);
            }
        }

        checkPathAndVersion();
    }, [path, gameId]);

    if (!path) {
        return (
            <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Game Location</h3>
                <p>No game found at {libraryLocation || 'the configured library location'}.</p>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-lg ${
            exists === null ? 'bg-card' :
            exists ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
            <h3 className="font-semibold mb-2">Game Location</h3>
            <p className="break-all">{path}</p>
            {exists === false && (
                <p className="mt-2 text-sm">Directory not found on filesystem</p>
            )}
            {exists && versionInfo && versionInfo.version && (
                <p className="mt-2 text-sm">Latest Version: v{versionInfo.version}</p>
            )}
            {exists && versionInfo && versionInfo.allVersions && versionInfo.allVersions.length > 1 && (
                <div className="mt-2 text-sm">
                    <p>All Versions:</p>
                    <ul className="list-disc list-inside mt-1">
                        {versionInfo.allVersions.map(v => (
                            <li key={v.version}>v{v.version}</li>
                        ))}
                    </ul>
                </div>
            )}
            {status && (
                <p className="mt-2 text-sm">Status: {status}</p>
            )}
        </div>
    );
}

export default function GameDetails() {
    const params = useParams();
    const router = useRouter();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        async function fetchGameDetails() {
            try {
                const response = await fetch(`/api/games/${params.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch game details');
                }
                const data = await response.json();
                setGame(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            fetchGameDetails();
        }
    }, [params.id]);

    const handleDeleteGame = async (deleteFiles) => {
        try {
            const response = await fetch(`/api/games/${params.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deleteFiles }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete game');
            }

            router.push('/library');
        } catch (error) {
            console.error('Error deleting game:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-red-100 text-red-700 p-4 rounded">
                    Error: {error}
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-yellow-100 text-yellow-700 p-4 rounded">
                    Game not found
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section with Gradient Overlay */}
            <div className="relative h-80 w-full bg-cover bg-center rounded-xl overflow-hidden">
                <div 
                    className="absolute inset-0" 
                    style={{
                        backgroundImage: `url(${game.cover_url})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        filter: 'blur(2px)',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h1 className="text-4xl font-bold text-text-primary mb-2">{game.name}</h1>
                    <div className="flex items-center gap-4 text-text-secondary">
                    {(game.metadata?.releaseYear || game.releaseDate) && (
                        <span className="flex items-center">
                            <i className="fas fa-calendar-alt mr-2" />
                            {game.metadata?.releaseYear || new Date(game.releaseDate).getFullYear()}
                        </span>
                    )}
                        {game.metadata?.rating && (
                            <span className="flex items-center">
                                <i className="fas fa-star mr-2" />
                                {game.metadata.rating}/100
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - File Information */}
                <div className="lg:col-span-1 space-y-6">
                    {/* File Information Card */}
                    <div className="bg-card rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                            <i className="fas fa-folder-open mr-2" />
                            File Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <i className="fas fa-folder text-primary mt-1 mr-3 w-5" />
                                <div>
                                    <span className="text-text-secondary text-sm">Path</span>
                                    <p className="text-text-primary break-all">{game.destination_path || 'Not set'}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <i className="fas fa-code-branch text-primary mt-1 mr-3 w-5" />
                                <div>
                                    <span className="text-text-secondary text-sm">Version</span>
                                    <p className="text-text-primary">{game.latestVersion ? `v${game.latestVersion}` : 'Unknown'}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <i className="fas fa-info-circle text-primary mt-1 mr-3 w-5" />
                                <div>
                                    <span className="text-text-secondary text-sm">Status</span>
                                    <p className="text-text-primary">{game.status || 'Not downloaded'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-card rounded-xl p-6 shadow-lg space-y-3">
                        <button
                            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center justify-center"
                            onClick={() => {/* TODO: Implement force search */}}
                        >
                            <i className="fas fa-sync-alt mr-2" /> Force Search
                        </button>
                        {game.status !== 'downloading' && (
                            <button
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                                onClick={() => {/* TODO: Implement download */}}
                            >
                                <i className="fas fa-download mr-2" /> Download
                            </button>
                        )}
                        <button
                            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <i className="fas fa-trash-alt mr-2" /> Remove
                        </button>
                    </div>
                </div>

                {/* Right Column - Game Details and Screenshots */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Game Description */}
                    <div className="bg-card rounded-xl p-6 shadow-lg">
                        <p className="text-text-secondary">
                            {game.metadata?.description || game.description || 'No description available'}
                        </p>
                    </div>

                    {/* Game Details */}
                    <div className="bg-card rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                            <i className="fas fa-gamepad mr-2" />
                            Game Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {game.metadata?.developers?.length > 0 && (
                                <div>
                                    <span className="text-text-secondary text-sm flex items-center">
                                        <i className="fas fa-code mr-2" /> Developers
                                    </span>
                                    <p className="text-text-primary">{game.metadata.developers.join(', ')}</p>
                                </div>
                            )}
                            {game.metadata?.publishers?.length > 0 && (
                                <div>
                                    <span className="text-text-secondary text-sm flex items-center">
                                        <i className="fas fa-building mr-2" /> Publishers
                                    </span>
                                    <p className="text-text-primary">{game.metadata.publishers.join(', ')}</p>
                                </div>
                            )}
                            {game.metadata?.genres?.length > 0 && (
                                <div>
                                    <span className="text-text-secondary text-sm flex items-center">
                                        <i className="fas fa-tags mr-2" /> Genres
                                    </span>
                                    <p className="text-text-primary">{game.metadata.genres.join(', ')}</p>
                                </div>
                            )}
                            {game.metadata?.platforms?.length > 0 && (
                                <div>
                                    <span className="text-text-secondary text-sm flex items-center">
                                        <i className="fas fa-desktop mr-2" /> Platforms
                                    </span>
                                    <p className="text-text-primary">{game.metadata.platforms.join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Game Modes */}
                    {game.metadata?.gameModes?.length > 0 && (
                        <div className="bg-card rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                                <i className="fas fa-users mr-2" />
                                Game Modes
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {game.metadata.gameModes.map((mode, index) => (
                                    <span
                                        key={index}
                                        className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-primary/30 transition-colors"
                                        onClick={() => router.push(`/library?mode=${mode}`)}
                                    >
                                        {mode}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Screenshots */}
                    {game.metadata?.screenshots?.length > 0 && (
                        <div className="bg-card rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                                <i className="fas fa-images mr-2" />
                                Screenshots
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {game.metadata.screenshots.map((url, index) => (
                                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                                        <img
                                            src={url}
                                            alt={`Screenshot ${index + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            <DeleteGameModal
                game={game}
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteGame}
            />
        </div>
    );
}