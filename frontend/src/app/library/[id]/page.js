'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

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
                </div>
                
                <div className="flex-grow">
                    <h1 className="text-3xl font-bold text-text-primary mb-4">{game.name}</h1>
                    <p className="text-text-secondary mb-4">{game.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-card p-4 rounded-lg">
                            <h3 className="font-semibold text-text-primary mb-2">Status</h3>
                            <p className="text-text-secondary">{game.status || 'Not downloaded'}</p>
                        </div>
                        
                        <div className="bg-card p-4 rounded-lg">
                            <h3 className="font-semibold text-text-primary mb-2">File Location</h3>
                            <p className="text-text-secondary break-all">
                                {game.destination_path || 'Not set'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
                            onClick={() => {/* TODO: Implement force search */}}
                        >
                            Force Search
                        </button>
                        <button 
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
                            onClick={() => {/* TODO: Implement send to indexer */}}
                        >
                            Send to Indexer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}