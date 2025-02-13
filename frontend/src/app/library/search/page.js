'use client';
import { useState } from 'react';
import GameCard from '../../components/GameCard';
import SearchResultModal from '../../components/SearchResultModal';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    async function handleSearch() {
        if (!searchTerm.trim()) {
            setMessage({ type: 'error', text: 'Please enter a game name.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        setSearchResults([]);
        setHasSearched(true); // Mark that a search has been performed

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchTerm }),
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

    const handleCardClick = (game) => {
        setSelectedGame(game);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedGame(null);
        setIsModalOpen(false);
    };

    const handleAddGame = async (gameData) => {
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Game "${gameData.name}" added to library.` });
                setSearchResults((prev) => 
                    prev.filter((g) => g.name !== gameData.name)
                );
                handleCloseModal();
            } else {
                const error = await response.json();
                setMessage({ 
                    type: 'error', 
                    text: error.error || 'Failed to add game to library.' 
                });
            }
        } catch (error) {
            console.error('Failed to add game to library:', error);
            setMessage({ 
                type: 'error', 
                text: 'Failed to add game to library.' 
            });
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
                    onKeyDown={handleKeyDown}
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
                <div
                    className={`p-4 mb-6 rounded ${
                        message.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : message.type === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                >
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
                {isLoading ? null : (
                    hasSearched && searchResults.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-text-secondary">
                            No games found matching your search.
                        </div>
                    ) : (
                        searchResults.map((game) => (
                            <GameCard
                                key={game.name}
                                game={game}
                                showVersion={false}
                                onClick={handleCardClick}
                            />
                        ))
                    )
                )}
            </div>

            {/* Modal */}
            <SearchResultModal
                game={{
                    ...result,
                    // Spread all metadata properties
                    genres: result.genres,
                    platforms: result.platforms,
                    developers: result.developers,
                    publishers: result.publishers,
                    rating: result.rating,
                    gameModes: result.gameModes,
                    screenshots: result.screenshots,
                    description: result.description,
                    releaseDate: result.releaseDate
                }}
                isOpen={selectedGame !== null}
                onClose={() => setSelectedGame(null)}
                onAddGame={handleAddGame}
            />
        </div>
    );
}