'use client';
import { useState } from 'react';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [message, setMessage] = useState(null);

    async function handleSearch() {
        if (!searchTerm.trim()) {
            setMessage({ type: 'error', text: 'Please enter a game name.' });
            return;
        }

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Failed to search for games:', error);
            setMessage({ type: 'error', text: 'Failed to search for games.' });
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
                    destination_path: `/library/${game.name.replace(/\s+/g, '_')}`
                }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Game "${game.name}" added to library.` });
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to add game to library.' });
            }
        } catch (error) {
            console.error('Failed to add game to library:', error);
            setMessage({ type: 'error', text: 'Failed to add game to library.' });
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-text-primary mb-4">Search for a Game</h1>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a game..."
                className="w-full border border-border-dark bg-card text-text-primary rounded px-3 py-2 mb-4"
            />
            <button
                onClick={handleSearch}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
            >
                Search
            </button>

            {message && (
                <p
                    className={`mt-4 ${
                        message.type === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}
                >
                    {message.text}
                </p>
            )}

            <div className="mt-6">
                {searchResults.map((game) => (
                    <div key={game.name} className="p-4 border rounded mb-4">
                        <h2 className="text-xl font-bold">{game.name}</h2>
                        <p>{game.description}</p>
                        <button
                            onClick={() => handleAddGame(game)}
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition mt-2"
                        >
                            Add to Library
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}