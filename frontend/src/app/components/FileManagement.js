'use client';
import React, { useState } from 'react';
import NfoModal from './NfoModal';

export default function FileManagement({ versions }) {
    const [expandedVersion, setExpandedVersion] = useState(null);
    const [nfoContent, setNfoContent] = useState(null);
    const [isNfoModalOpen, setIsNfoModalOpen] = useState(false);
    const [isLoadingNfo, setIsLoadingNfo] = useState(false); // New loading state for NFO modal

    const toggleExpand = (versionId) => {
        setExpandedVersion(expandedVersion === versionId ? null : versionId);
    };

    const fetchNfoContent = async (nfoPath, version) => {
        if (!nfoPath) {
            console.error('NFO path is undefined');
            return;
        }

        try {
            setIsLoadingNfo(true); // Set loading state
            const res = await fetch(`/api/games/nfo?path=${encodeURIComponent(nfoPath)}`);
            if (!res.ok) throw new Error('Failed to fetch NFO content');
            const data = await res.json();

            // Store the NFO content with the version
            version.nfoContent = data;

            // Update state to trigger re-render
            setNfoContent(data);
            setIsNfoModalOpen(true);
        } catch (err) {
            console.error('Error fetching NFO content:', err);
        } finally {
            setIsLoadingNfo(false); // Reset loading state
        }
    };

    const handleDeleteVersion = (versionPath) => {
        console.log(`Delete version at path: ${versionPath}`);
        // TODO: Implement delete functionality
    };

    const handleDownloadVersion = (versionPath) => {
        console.log(`Download version at path: ${versionPath}`);
        // TODO: Implement download functionality
    };

    return (
        <div className="bg-card rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <i className="fas fa-folder-open mr-2" />
                Versions
            </h3>
            {versions.length === 0 ? (
                <p className="text-text-secondary">No versions available to manage.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th className="py-2 px-4 text-sm text-text-secondary">Version</th>
                                <th className="py-2 px-4 text-sm text-text-secondary">File Size</th>
                                <th className="py-2 px-4 text-sm text-text-secondary">Status</th>
                                <th className="py-2 px-4 text-sm text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {versions.map((version) => (
                                <React.Fragment key={version.version}>
                                    <tr className={`hover:bg-gray-800 ${expandedVersion === version.version ? 'bg-gray-800' : ''}`}>
                                        <td className="py-2 px-4 text-text-primary">
                                            v{version.version}
                                        </td>
                                        <td className="py-2 px-4 text-text-secondary">
                                            {version.size ? (() => {
                                                const sizeInGB = version.size / (1024 * 1024 * 1024);
                                                const sizeInMB = version.size / (1024 * 1024);
                                                return sizeInGB >= 1 
                                                    ? `${sizeInGB.toFixed(2)} GB` 
                                                    : `${sizeInMB.toFixed(2)} MB`;
                                            })() : 'Unknown'}
                                        </td>
                                        <td className="py-2 px-4">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                version.status === 'completed'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : version.status === 'empty'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {version.status}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 flex gap-2">
                                            <button
                                                className="text-blue-400 hover:text-blue-500"
                                                onClick={() => toggleExpand(version.version)}
                                            >
                                                <i className={`fas ${
                                                    expandedVersion === version.version
                                                        ? 'fa-chevron-up'
                                                        : 'fa-chevron-down'
                                                }`} />
                                            </button>
                                            <button
                                                className={`text-yellow-400 ${version.nfoPath ? 'hover:text-yellow-500' : 'opacity-50 cursor-not-allowed'}`}
                                                onClick={() => version.nfoPath && fetchNfoContent(version.nfoPath, version)}
                                                disabled={!version.nfoPath}
                                                title={version.nfoPath ? 'View NFO' : 'No NFO file available'}
                                            >
                                                <i className="fas fa-file-alt" />
                                            </button>
                                            <button
                                                className="text-red-400 hover:text-red-500"
                                                onClick={() => handleDeleteVersion(version.path)}
                                            >
                                                <i className="fas fa-trash-alt" />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedVersion === version.version && (
                                        <tr>
                                            <td colSpan="4" className="py-4 px-6 bg-gray-900 text-text-secondary space-y-2">
                                                <div className="space-y-2">
                                                    <p><strong>File Path:</strong> {version.path || 'Unknown'}</p>

                                                    {/* Patch Notes Section */}
                                                    {version.nfoContent?.parsed?.patchNotes && (
                                                        <div>
                                                            <strong className="text-yellow-400">Patch Notes:</strong>
                                                            <p className="ml-4">{version.nfoContent.parsed.patchNotes}</p>
                                                        </div>
                                                    )}

                                                    {/* Required Releases Section */}
                                                    {version.nfoContent?.parsed?.requiredReleases?.length > 0 && (
                                                        <div>
                                                            <strong className="text-yellow-400">Required Releases:</strong>
                                                            <ul className="ml-8 list-disc">
                                                                {version.nfoContent.parsed.requiredReleases.map((release, index) => (
                                                                    <li key={index}>{release}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Install Instructions Section */}
                                                    {version.nfoContent?.parsed?.installInstructions?.length > 0 && (
                                                        <div>
                                                            <strong className="text-yellow-400">Install Instructions:</strong>
                                                            <ol className="ml-8 list-decimal">
                                                                {version.nfoContent.parsed.installInstructions.map((instruction, index) => (
                                                                    <li key={index}>{instruction}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}

                                                    {/* General Notes Section */}
                                                    {version.nfoContent?.parsed?.generalNotes?.length > 0 && (
                                                        <div>
                                                            <strong className="text-yellow-400">General Notes:</strong>
                                                            <ul className="ml-8 list-disc">
                                                                {version.nfoContent.parsed.generalNotes.map((note, index) => (
                                                                    <li key={index}>{note}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Crack Instructions Section */}
                                                    {version.nfoContent?.parsed?.crackInstructions?.length > 0 && (
                                                        <div>
                                                            <strong className="text-yellow-400">Crack Instructions:</strong>
                                                            <ul className="ml-8 list-disc">
                                                                {version.nfoContent.parsed.crackInstructions.map((instruction, index) => (
                                                                    <li key={index}>{instruction}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <NfoModal
                isOpen={isNfoModalOpen}
                onClose={() => setIsNfoModalOpen(false)}
                content={nfoContent}
                isLoading={isLoadingNfo} // Pass loading state to modal
            />
        </div>
    );
}