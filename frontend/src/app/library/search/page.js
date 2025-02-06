'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSearch() {
        if (!searchTerm.trim()) {
            setMessage({ type: 'error', text: 'Please enter a game name.' });
            return;
        }
    
        setIsLoading(true);
        setMessage(null);
        setSearchResults([]);
    
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchTerm })
            });
    
            const data = await response.json();
            console.log('Search results from backend:', data); // Add this log
    
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setMessage({ type: 'error', text: 'Unexpected response format from server.' });
            }
        } catch (error) {
            console.error('Failed to search for games:', error);
            setMessage({ type: 'error', text: 'Failed to search for games.' });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddGame(game) {
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: game.name,
                    release_date: game.releaseDate,
                    description: game.description,
                    destination_path: `/library/${game.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    cover_url: game.cover_url
                }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Game "${game.name}" added to library.` });
                // Remove the game from search results
                setSearchResults(prev => prev.filter(g => g.name !== game.name));
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to add game to library.' });
            }
        } catch (error) {
            console.error('Failed to add game to library:', error);
            setMessage({ type: 'error', text: 'Failed to add game to library.' });
        }
    }

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Search for a Game</h1>
            
            {/* Search Input and Button */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search for a game..."
                    className="flex-1 border border-border-dark bg-card text-text-primary rounded px-4 py-2"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-hover transition disabled:opacity-50"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {/* Messages */}
            {message && (
                <div className={`p-4 mb-6 rounded ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' :
                    message.type === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Search Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(searchResults) ? (
                    searchResults.length > 0 ? (
                        searchResults.map((game) => (
                            <div key={game.name} className="bg-card border border-border-dark rounded-lg overflow-hidden hover:border-primary transition">
                                {game.cover_url && (
                                    <div className="relative h-48 w-full">
                                        <Image
                                            src={game.cover_url}
                                            alt={game.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h2 className="text-xl font-bold text-text-primary mb-2">{game.name}</h2>
                                    {game.releaseDate && (
                                        <p className="text-sm text-text-secondary mb-2">
                                            Released: {new Date(game.releaseDate).getFullYear()}
                                        </p>
                                    )}
                                    <p className="text-text-secondary mb-4 line-clamp-3">
                                        {game.description || 'No description available.'}
                                    </p>
                                    <button
                                        onClick={() => handleAddGame(game)}
                                        className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
                                    >
                                        Add to Library
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-text-secondary">
                            No games found matching your search.
                        </div>
                    )
                ) : (
                    <div className="col-span-full text-center py-8 text-red-500">
                        Error loading search results. Please try again.
                    </div>
                )}
            </div>
        </div>
    );
}