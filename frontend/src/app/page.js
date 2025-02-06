'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DashboardCard from '../app/components/DashboardCard';

export default function Library() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
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

      {loading ? (
        <div className="text-text-secondary">Loading games...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : games.length === 0 ? (
        <div className="text-text-secondary">
          No games in your library. Click "Add a New Game" to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <DashboardCard key={game.id} title={game.name}>
              <div className="space-y-2">
                {game.cover_url && (
                  <img
                    src={game.cover_url}
                    alt={game.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <p className="text-sm">{game.description || 'No description available.'}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm">
                    {game.release_date ? new Date(game.release_date).getFullYear() : 'Unknown year'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    game.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    game.status === 'downloading' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {game.status}
                  </span>
                </div>
              </div>
            </DashboardCard>
          ))}
        </div>
      )}
    </motion.div>
  );
}