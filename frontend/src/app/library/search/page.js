'use client';
import { useState } from 'react';
import GameCard from '../../components/GameCard';
import SearchResultModal from '../../components/SearchResultModal';
import ErrorBoundary from '../../components/ErrorBoundary';

export const dynamic = 'force-dynamic';

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
        setHasSearched(true);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchTerm }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                throw new Error('Unexpected response format from server');
            }
        } catch (error) {
            console.error('Search failed:', error);
            setMessage({ 
                type: 'error', 
                text: error.message || 'Failed to search for games.' 
            });
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
                body: JSON.stringify({
                    ...gameData,
                    metadata: {
                        ...gameData.metadata,
                        releaseYear: gameData.releaseDate ? 
                            new Date(gameData.releaseDate).getFullYear() : null
                    }
                }),
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to add game');
            }

            setMessage({ 
                type: 'success', 
                text: `Game "${gameData.name}" added to library.` 
            });
            setSearchResults(prev => prev.filter(g => g.name !== gameData.name));
            handleCloseModal();
        } catch (error) {
            console.error('Add game failed:', error);
            setMessage({ 
                type: 'error', 
                text: error.message || 'Failed to add game to library.' 
            });
        }
    };

    return (
        <ErrorBoundary>
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
                    <div className={`p-4 mb-6 rounded ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
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
                    {!isLoading && hasSearched && searchResults.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-text-secondary">
                            No games found matching your search.
                        </div>
                    ) : (
                        searchResults.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                showVersion={false}
                                onClick={() => handleCardClick(game)}
                            />
                        ))
                    )}
                </div>

                {/* Search Result Modal */}
                {selectedGame && (
                    <SearchResultModal
                        game={{
                            ...selectedGame,
                            releaseDate: selectedGame.releaseDate,
                            metadata: {
                                genres: selectedGame.genres || [],
                                platforms: selectedGame.platforms || [],
                                developers: selectedGame.developers || [],
                                publishers: selectedGame.publishers || [],
                                rating: selectedGame.rating,
                                gameModes: selectedGame.gameModes || [],
                                screenshots: selectedGame.screenshots || [],
                                description: selectedGame.description || '',
                            }
                        }}
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onAddGame={handleAddGame}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}