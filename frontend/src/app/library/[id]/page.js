'use client';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import DeleteGameModal from '../../components/DeleteGameModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import FileManagement from '../../components/FileManagement';
import Toast from '../../components/Toast';
import IndexerResultModal from '../../components/IndexerResultModal'

export const dynamic = 'force-dynamic';

const FileLocationInfo = ({ path, libraryLocation, status, gameId }) => {
    const [exists, setExists] = useState(null);
    const [versionInfo, setVersionInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Check path existence
                const pathRes = await fetch(`/api/games/check-path?path=${encodeURIComponent(path)}`);
                if (!pathRes.ok) throw new Error('Path check failed');
                const pathData = await pathRes.json();
                setExists(pathData.exists);

                // Fetch version info if needed
                if (pathData.exists && gameId) {
                    const versionRes = await fetch(`/api/games/${gameId}/version`);
                    if (!versionRes.ok) throw new Error('Version check failed');
                    const versionData = await versionRes.json();
                    setVersionInfo(versionData);
                }
            } catch (err) {
                setError(err.message);
                console.error('File location check error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (path) fetchData();
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
            {loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
            ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
            ) : (
                <>
                    <p className="break-all">{path}</p>
                    {exists === false && (
                        <p className="mt-2 text-sm">Directory not found on filesystem</p>
                    )}
                    {exists && versionInfo?.version && (
                        <p className="mt-2 text-sm">Latest Version: v{versionInfo.version}</p>
                    )}
                    {exists && versionInfo?.allVersions?.length > 1 && (
                        <div className="mt-2 text-sm">
                            <p>All Versions:</p>
                            <ul className="list-disc list-inside mt-1">
                                {versionInfo.allVersions.map(v => (
                                    <li key={v.version}>v{v.version}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {status && <p className="mt-2 text-sm">Status: {status}</p>}
                </>
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
    const [isScanning, setIsScanning] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const res = await fetch(`/api/games/${params.id}`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                
                if (!data) throw new Error('Game not found');
                
                // Ensure we're using the same version and status from the database
                setGame({
                    ...data,
                    metadata: data.metadata || {},
                    latestVersion: data.latestVersion || null,
                    status: data.status || 'Not downloaded',
                    allVersions: data.allVersions || []
                });
            } catch (err) {
                setError(err.message);
                console.error('Game fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchGame();
    }, [params.id]);

    const handleForceScan = async () => {
        setIsScanning(true);
        setToastMessage('Scanning game directory...');
        setIsToastVisible(true);

        try {
            const res = await fetch(`/api/games/${params.id}/scan`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to scan game directory');
            const updatedGame = await res.json();
            setGame(updatedGame);
            setToastMessage('Scan completed successfully!');
        } catch (err) {
            console.error('Error scanning game directory:', err);
            setError('Failed to scan game directory');
            setToastMessage('Error: Failed to scan game directory');
        } finally {
            setIsScanning(false);
            setTimeout(() => setIsToastVisible(false), 3000); // Hide toast after 3 seconds
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleDeleteGame = async (deleteFiles) => {
        try {
            const res = await fetch(`/api/games/${params.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteFiles }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Delete failed');
            }

            router.push('/library');
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.message);
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?query=${encodeURIComponent(game.name)}`);
            if (!res.ok) throw new Error('Search failed');
            const results = await res.json();
            setSearchResults(results);
            setIsSearchModalOpen(true);
        } catch (error) {
            console.error('Search error:', error);
            setToastMessage('Error: Failed to search for game');
            setIsToastVisible(true);
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = async (result) => {
        try {
            const res = await fetch(`/api/games/${game.id}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ downloadUrl: result.downloadUrl }),
            });
            if (!res.ok) throw new Error('Download failed');
            setToastMessage('Download started successfully!');
            setIsToastVisible(true);
        } catch (error) {
            console.error('Download error:', error);
            setToastMessage('Error: Failed to start download');
            setIsToastVisible(true);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Toast Notification */}
                <Toast
                    message={toastMessage}
                    isVisible={isToastVisible}
                    onClose={() => setIsToastVisible(false)}
                />
                {error ? (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        Error: {error}
                    </div>
                ) : !game ? (
                    <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
                        Game not found
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="relative h-80 w-full bg-cover bg-center rounded-xl overflow-hidden">
                            <div 
                                className="absolute inset-0" 
                                style={{
                                    backgroundImage: `url(${game.cover_url})`,
                                    backgroundSize: 'cover',
                                    filter: 'blur(2px)',
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <h1 className="text-4xl font-bold text-text-primary mb-2">
                                    {game.name}
                                </h1>
                                <div className="flex items-center gap-4 text-text-secondary">
                                    {(game.metadata?.releaseYear || game.release_date) && (
                                        <span className="flex items-center">
                                            <i className="fas fa-calendar-alt mr-2" />
                                            {game.metadata?.releaseYear || 
                                                new Date(game.release_date).getFullYear()}
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
                                                <p className="text-text-primary">
                                                    {game.latestVersion ? `v${game.latestVersion}` : 'Unknown'}
                                                    {game.allVersions && game.allVersions.length > 1 && (
                                                        <span className="text-text-secondary text-sm ml-2">
                                                            (+{game.allVersions.length - 1} other versions)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <i className="fas fa-info-circle text-primary mt-1 mr-3 w-5" />
                                            <div>
                                                <span className="text-text-secondary text-sm">Status</span>
                                                <p className={`text-text-primary ${
                                                    game.status === 'completed' ? 'text-green-400' :
                                                    game.status === 'downloading' ? 'text-blue-400' :
                                                    'text-text-primary'
                                                }`}>
                                                    {game.status === 'completed' ? 'Downloaded' :
                                                    game.status === 'downloading' ? 'Downloading' :
                                                    game.status === 'pending' ? 'Pending' :
                                                    'Not downloaded'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="bg-card rounded-xl p-6 shadow-lg space-y-3">
                                    <button
                                        className={`w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center justify-center ${
                                            isScanning ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        onClick={handleForceScan}
                                        disabled={isScanning}
                                    >
                                        {isScanning ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-sync-alt mr-2" />
                                                Scan
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={`w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition flex items-center justify-center ${
                                            isSearching ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                    >
                                        {isSearching ? (
                                            <>
                                                <div className="rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-search mr-2" />
                                                Search
                                            </>
                                        )}
                                    </button>
                                    {game.status !== 'completed' && game.status !== 'downloading' && (
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

                                {/* File Management Info */}
                                <FileManagement 
                                    versions={game.allVersions || []} 
                                    nfoPath={game.nfoPath} 
                                />

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

                        {/* Search Modal */}
                        <IndexerResultModal
                            isOpen={isSearchModalOpen}
                            onClose={() => setIsSearchModalOpen(false)}
                            results={searchResults}
                            onDownload={handleDownload}
                        />
                    </>
                )}
            </div>
        </ErrorBoundary>
    );
}