'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function GameCard({ game, onClick, showVersion = true }) {
  // Improved release date handling
  const getReleaseYear = () => {
    const dateSource = game.releaseDate || game.release_date;
    if (!dateSource) return 'Unknown release';
    
    try {
      return new Date(dateSource).getFullYear();
    } catch {
      return 'Invalid date';
    }
  };

  // Card content component (preserves your animations)
  const CardContent = () => (
    <motion.div
      className="bg-card border border-border-dark rounded-lg shadow-lg shadow-black/10 w-full cursor-pointer h-full"
      animate={{ backgroundColor: '#1E1E1E' }}
      whileHover={{ scale: 1.02, backgroundColor: '#252525' }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        backgroundColor: { duration: 0.2 }
      }}
    >
      <div className="relative aspect-[3/4] w-full bg-gray-800 flex items-center justify-center rounded-t-lg overflow-hidden">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500 text-sm">No Cover Art</span>
        )}
      </div>

      <div className="p-3">
        <h2 className="text-base font-semibold text-text-primary mb-1 line-clamp-1">
          {game.name}
        </h2>
        
        {showVersion && game.latestVersion && (
          <div className="text-xs text-text-secondary mb-1">
            <i className="fas fa-code-branch text-primary mr-2" />
            Version: v{game.latestVersion}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary">
            <i className="fas fa-calendar-alt mr-2" />
            {getReleaseYear()}
          </span>
          
          {game.status && (
            <span className={`px-2 py-0.5 rounded text-xs ${
              game.status === 'completed' ? 'bg-green-500/20 text-green-300' :
              game.status === 'downloading' ? 'bg-blue-500/20 text-blue-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {game.status}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  return onClick ? (
    <div onClick={onClick}>
      <CardContent />
    </div>
  ) : (
    <Link href={`/library/${game.id}`} passHref legacyBehavior>
      <a className="block h-full">
        <CardContent />
      </a>
    </Link>
  );
}