'use client';
import { useState, useEffect } from 'react';

export default function SearchResultModal({ game, isOpen, onClose, onAddGame }) {
    const [libraryLocations, setLibraryLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        async function fetchLibraryLocations() {
            try {
                const response = await fetch('/api/settings/library-locations');
                const data = await response.json();
                setLibraryLocations(data);
                if (data.length > 0) {
                    setSelectedLocation(data[0].id); // Default to the first location
                }
            } catch (error) {
                console.error('Failed to fetch library locations:', error);
            }
        }

        if (isOpen) {
            fetchLibraryLocations();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            ...game,
            destination_path: formData.get('destination'),
            library_location_id: selectedLocation,
            should_search: formData.get('should_search') === 'on'
        };
        onAddGame(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-lg w-full m-4">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">{game.name}</h2>
                    
                    {game.cover_url && (
                        <img
                            src={game.cover_url}
                            alt={game.name}
                            className="w-full h-auto rounded mb-4"
                        />
                    )}
                    
                    <p className="text-sm text-text-secondary mb-4">
                        {game.description || 'No description available.'}
                    </p>
                    
                    <div className="mb-4">
                        <label className="block text-sm text-text-secondary mb-2">
                            Destination Location
                        </label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full bg-gray-800 text-white p-2 rounded"
                        >
                            {libraryLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name} ({location.path})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="mb-4">
                        <label className="flex items-center text-sm text-text-secondary">
                            <input 
                                type="checkbox" 
                                name="should_search"
                                className="mr-2" 
                            />
                            Search for game
                        </label>
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition"
                    >
                        Add to Library
                    </button>
                    
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                        Close
                    </button>
                </form>
            </div>
        </div>
    );
}