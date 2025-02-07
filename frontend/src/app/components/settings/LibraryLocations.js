'use client';
import { useState, useEffect } from 'react';

export default function LibraryLocations({ value, onChange }) {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLocations() {
            try {
                const response = await fetch('/api/settings/library-locations');
                if (!response.ok) throw new Error('Failed to fetch locations');
                const data = await response.json();
                setLocations(data);
                // Set default value if none provided
                if (!value && data.length > 0) {
                    onChange(data[0].path);
                }
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
    if (locations.length === 0) {
        return (
            <div className="text-yellow-500">
                No library locations configured. Please add locations in settings.
            </div>
        );
    }

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-border-dark bg-card text-text-primary rounded px-4 py-2"
        >
            {locations.map((location) => (
                <option key={location.id} value={location.path}>
                    {location.name} ({location.path})
                </option>
            ))}
        </select>
    );
}