'use client';
import React from 'react';
import LibraryLocations from '../components/settings/LibraryLocations';
import Indexers from '../components/settings/Indexers';
import DownloadClients from '../components/settings/DownloadClients';
import MetadataSettings from '../components/settings/MetadataSettings';
import GeneralSettings from '../components/settings/GeneralSettings';

const SettingsPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                    <GeneralSettings />
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Library Locations</h2>
                    <LibraryLocations />
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Indexers</h2>
                    <Indexers />
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Download Clients</h2>
                    <DownloadClients />
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4">Metadata Settings</h2>
                    <MetadataSettings />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;