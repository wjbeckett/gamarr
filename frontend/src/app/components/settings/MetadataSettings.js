'use client';
import React, { useState, useEffect } from 'react';

export default function MetadataSettings() {
    const [settings, setSettings] = useState({ igdb_client_id: '', igdb_client_secret: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings/general');
                if (!response.ok) throw new Error('Failed to fetch metadata settings');
                const data = await response.json();
                const igdbSettings = data.reduce((acc, setting) => {
                    acc[setting.key] = setting.value;
                    return acc;
                }, {});
                setSettings({
                    igdb_client_id: igdbSettings.igdb_client_id || '',
                    igdb_client_secret: igdbSettings.igdb_client_secret || '',
                });
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
            await fetch('/api/settings/general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'igdb_client_id', value: settings.igdb_client_id }),
            });
            await fetch('/api/settings/general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'igdb_client_secret', value: settings.igdb_client_secret }),
            });
            alert('Metadata settings saved successfully!');
        } catch (err) {
            setError('Failed to save metadata settings');
        }
    };

    if (loading) return <div>Loading metadata settings...</div>;
    if (error) return <div>Error loading metadata settings: {error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Metadata Settings</h2>
            <div className="space-y-2">
                <input
                    type="text"
                    value={settings.igdb_client_id}
                    onChange={(e) => setSettings({ ...settings, igdb_client_id: e.target.value })}
                    placeholder="IGDB Client ID"
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    value={settings.igdb_client_secret}
                    onChange={(e) => setSettings({ ...settings, igdb_client_secret: e.target.value })}
                    placeholder="IGDB Client Secret"
                    className="border p-2 w-full"
                />
                <button
                    onClick={handleSaveSettings}
                    className="bg-blue-500 text-white px-4 py-2 w-full"
                >
                    Save Metadata Settings
                </button>
            </div>
        </div>
    );
}