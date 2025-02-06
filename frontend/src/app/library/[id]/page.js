'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// New FileLocationInfo component
function FileLocationInfo({ path, status }) {
    const [exists, setExists] = useState(null);
    
    useEffect(() => {
        async function checkPath() {
            if (!path) return;
            
            try {
                const response = await fetch(`/api/games/check-path?path=${encodeURIComponent(path)}`);
                const data = await response.json();
                setExists(data.exists);
            } catch (error) {
                console.error('Failed to check path:', error);
                setExists(false);
            }
        }
        
        checkPath();
    }, [path]);

    if (!path) {
        return (
            <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Game Location</h3>
                <p>Game has not been downloaded yet</p>
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
            {status && (
                <p className="mt-2 text-sm">Status: {status}</p>
            )}
        </div>
    );
}

export default function GameDetails() {
    const params = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        <div className="p-6 max-w-7xl mx-auto">
            <div
                className="relative h-64 w-full bg-cover bg-center rounded-lg mb-6"
                style={{ 
                    backgroundImage: `url(${game.cover_url})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg"></div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-48 flex-shrink-0">
                    <img
                        src={game.cover_url}
                        alt={game.name}
                        className="w-full h-64 object-cover rounded-lg"
                    />
                    {game.release_date && (
                        <div className="mt-4 text-center text-text-secondary">
                            Released: {new Date(game.release_date).getFullYear()}
                        </div>
                    )}
                </div>
                
                <div className="flex-grow">
                    <h1 className="text-3xl font-bold text-text-primary mb-4">{game.name}</h1>
                    <p className="text-text-secondary mb-6">{game.description}</p>
                    
                    <div className="space-y-4 mb-6">
                        <div className="bg-card p-4 rounded-lg">
                            <h3 className="font-semibold text-text-primary mb-2">Game Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-text-secondary">
                                <div>
                                    <span className="font-medium">Status:</span> {game.status || 'Not downloaded'}
                                </div>
                                {game.library_name && (
                                    <div>
                                        <span className="font-medium">Library:</span> {game.library_name}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <FileLocationInfo 
                            path={game.destination_path} 
                            status={game.status}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button 
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
                            onClick={() => {/* TODO: Implement force search */}}
                        >
                            Force Search
                        </button>
                        {game.status !== 'downloading' && (
                            <button 
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                                onClick={() => {/* TODO: Implement download */}}
                            >
                                Download
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}