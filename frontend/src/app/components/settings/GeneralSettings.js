'use client';
import React, { useState, useEffect } from 'react';

export default function GeneralSettings() {
    const [settings, setSettings] = useState({
        default_library_location: '',
        theme: 'light', // Default to 'light' theme
    });
    const [libraryLocations, setLibraryLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                // Fetch general settings
                const response = await fetch('/api/settings/general');
                if (!response.ok) throw new Error('Failed to fetch general settings');
                const data = await response.json();
                const generalSettings = data.reduce((acc, setting) => {
                    acc[setting.key] = setting.value;
                    return acc;
                }, {});
                setSettings({
                    default_library_location: generalSettings.default_library_location || '',
                    theme: generalSettings.theme || 'light',
                });

                // Fetch library locations for the dropdown
                const locationsResponse = await fetch('/api/settings/library-locations');
                if (!locationsResponse.ok) throw new Error('Failed to fetch library locations');
                const locationsData = await locationsResponse.json();
                setLibraryLocations(locationsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, []);

    const handleSaveSettings = async () => {
        try {
            // Save default library location
            await fetch('/api/settings/general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'default_library_location', value: settings.default_library_location }),
            });

            // Save theme
            await fetch('/api/settings/general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'theme', value: settings.theme }),
            });

            alert('General settings saved successfully!');
        } catch (err) {
            setError('Failed to save general settings');
        }
    };

    if (loading) return <div>Loading general settings...</div>;
    if (error) return <div>Error loading general settings: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
                {/* Default Library Location */}
                <div>
                    <label className="block text-sm font-medium mb-2">Default Library Location</label>
                    <select
                        value={settings.default_library_location}
                        onChange={(e) => setSettings({ ...settings, default_library_location: e.target.value })}
                        className="w-full border border-border-dark bg-card text-text-primary rounded px-4 py-2"
                    >
                        <option value="">Select a library location</option>
                        {libraryLocations.map((location) => (
                            <option key={location.id} value={location.path}>
                                {location.name} ({location.path})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Theme */}
                <div>
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <select
                        value={settings.theme}
                        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                        className="w-full border border-border-dark bg-card text-text-primary rounded px-4 py-2"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSaveSettings}
                    className="bg-blue-500 text-white px-4 py-2 w-full"
                >
                    Save General Settings
                </button>
            </div>
        </div>
    );
}