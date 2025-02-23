'use client';
import React, { useState } from 'react';
import { formatBytes, formatDate } from '../utils/formatters';

export default function IndexerResultModal({ isOpen, onClose, results, onDownload }) {
    const [sortBy, setSortBy] = useState({ column: 'age', direction: 'asc' }); // Default sort by age (ascending)

    if (!isOpen) return null;

    // Helper function to extract the release group from the title
    const extractReleaseGroup = (title) => {
        const match = title.match(/-(\w+)$/); // Matches the last hyphen and the group name
        return match ? match[1] : 'Unknown';
    };

    // Helper function to format the age
    const formatAge = (age) => {
        if (age < 1) return `${Math.round(age * 24)} hours`;
        return `${Math.round(age)} days`;
    };

    // Sorting logic
    const sortedResults = [...results].sort((a, b) => {
        const { column, direction } = sortBy;
        const multiplier = direction === 'asc' ? 1 : -1;

        if (column === 'age') {
            return (a.age - b.age) * multiplier; // Sort by age
        } else if (column === 'size') {
            return (a.size - b.size) * multiplier; // Sort by size
        } else if (column === 'seeders') {
            return (a.seeders - b.seeders) * multiplier; // Sort by seeders
        } else if (column === 'title') {
            return a.title.localeCompare(b.title) * multiplier; // Sort alphabetically by title
        }
        return 0;
    });

    // Handle column header click to toggle sorting
    const handleSort = (column) => {
        setSortBy((prev) => ({
            column,
            direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Search Results</h2>

                <div className="overflow-y-auto flex-grow">
                    <table className="w-full">
                        <thead className="text-text-secondary text-sm">
                            <tr>
                                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('protocol')}>
                                    Source
                                </th>
                                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('age')}>
                                    Age
                                </th>
                                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('title')}>
                                    Title
                                </th>
                                <th className="text-left p-2">Indexer</th>
                                <th className="text-right p-2 cursor-pointer" onClick={() => handleSort('size')}>
                                    Size
                                </th>
                                <th className="text-right p-2 cursor-pointer" onClick={() => handleSort('seeders')}>
                                    Peers
                                </th>
                                <th className="text-left p-2">Release Group</th>
                                <th className="text-right p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedResults.map((result, index) => (
                                <tr key={index} className="border-t border-border-dark">
                                    {/* Source (Protocol) */}
                                    <td className="p-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm ${
                                                result.protocol === 'torrent'
                                                    ? 'bg-green-500/20 text-green-500' // Green for Torrent
                                                    : 'bg-blue-500/20 text-blue-500' // Blue for NZB
                                            }`}
                                        >
                                            {result.protocol}
                                        </span>
                                    </td>

                                    {/* Age */}
                                    <td className="p-2 text-text-secondary">{formatAge(result.age)}</td>

                                    {/* Title */}
                                    <td className="p-2 text-text-primary">{result.title}</td>

                                    {/* Indexer */}
                                    <td className="p-2 text-text-secondary">{result.indexer}</td>

                                    {/* Size */}
                                    <td className="p-2 text-right text-text-secondary">{formatBytes(result.size)}</td>

                                    {/* Peers */}
                                    <td className="p-2 text-right">
                                        <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm">
                                            {result.seeders}/{result.leechers}
                                        </span>
                                    </td>

                                    {/* Release Group */}
                                    <td className="p-2">
                                        <span className="bg-purple-500/20 text-purple-500 px-3 py-1 rounded-full text-sm">
                                            {extractReleaseGroup(result.title)}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-2 text-right">
                                        <button
                                            onClick={() => onDownload(result)}
                                            className="text-primary hover:text-primary-hover"
                                        >
                                            <i className="fas fa-download"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-700 text-text-primary px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}