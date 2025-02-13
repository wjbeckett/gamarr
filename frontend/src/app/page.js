'use client';
import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import GameCard from '../app/components/GameCard';
import FilterBadge from '../app/components/FilterBadge';

function FilteredContent({ games, searchTerm, filterStatus, sortBy }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modeFilter = searchParams.get('mode');

    const filteredAndSortedGames = games
        .filter(game => {
            const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || game.status === filterStatus;
            const matchesMode = !modeFilter || 
                (game.metadata?.gameModes || []).includes(modeFilter);
            return matchesSearch && matchesStatus && matchesMode;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.release_date) - new Date(a.release_date);
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                default:
                    return 0;
            }
        });

    const clearModeFilter = () => {
        router.push('/library');
    };

    return (
        <>
            {modeFilter && (
                <div className="mb-4">
                    <FilterBadge 
                        label={`Game Mode: ${modeFilter}`}
                        onClear={clearModeFilter}
                    />
                </div>
            )}
            
            {filteredAndSortedGames.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                    {modeFilter 
                        ? `No games found with game mode: ${modeFilter}`
                        : searchTerm || filterStatus !== 'all' 
                            ? 'No games match your search criteria.'
                            : 'No games in your library. Click "Add a New Game" to get started!'}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredAndSortedGames.map((game) => (
                        <Link 
                            key={game.id} 
                            href={`/library/${game.id}`}
                            passHref
                        >
                            <a className="block h-full">
                                <GameCard game={game} />
                            </a>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}

export default function Library() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        async function fetchGames() {
            try {
                const response = await fetch('/api/games');
                if (!response.ok) throw new Error('Failed to fetch games');
                const data = await response.json();
                setGames(data);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching games:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchGames();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Library</h1>
                    <p className="text-text-secondary mt-2">
                        Manage your game library and add new games.
                    </p>
                </div>
                <Link
                    href="/library/search"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
                >
                    Add a New Game
                </Link>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow px-4 py-2 bg-card rounded border border-border-dark focus:outline-none focus:border-primary"
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-card rounded border border-border-dark focus:outline-none focus:border-primary"
                >
                    <option value="name">Sort by Name</option>
                    <option value="date">Sort by Release Date</option>
                    <option value="status">Sort by Status</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-card rounded border border-border-dark focus:outline-none focus:border-primary"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Downloaded</option>
                    <option value="downloading">Downloading</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded">Error: {error}</div>
            ) : (
                <Suspense fallback={<div>Loading...</div>}>
                    <FilteredContent 
                        games={games}
                        searchTerm={searchTerm}
                        filterStatus={filterStatus}
                        sortBy={sortBy}
                    />
                </Suspense>
            )}
        </motion.div>
    );
}