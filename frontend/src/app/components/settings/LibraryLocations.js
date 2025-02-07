'use client';
import { useState, useEffect } from 'react';

export default function LibraryLocations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLocations() {
            try {
                const response = await fetch('/api/settings/library-locations');
                if (!response.ok) throw new Error('Failed to fetch locations');
                const data = await response.json();

                // Ensure the response is an array
                if (!Array.isArray(data)) throw new Error('Invalid response format');
                setLocations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchLocations();
    }, []);

    if (loading) return <div>Loading locations...</div>;
    if (error) return <div>Error loading locations: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Library Locations</h2>
            <ul>
                {locations.map((location) => (
                    <li key={location.id} className="mb-2">
                        {location.name} ({location.path})
                    </li>
                ))}
            </ul>
        </div>
    );
}