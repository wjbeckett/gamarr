'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function GameCard({ game, onClick, showVersion = true }) { // Add showVersion prop with default value
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick(game);
        } else {
            router.push(`/library/${game.id}`);
        }
    };

    return (
        <motion.div
            className="bg-card border border-border-dark rounded-lg shadow-lg shadow-black/10 w-full cursor-pointer"
            animate={{
                backgroundColor: '#1E1E1E',
            }}
            whileHover={{
                scale: 1.02,
                backgroundColor: '#252525',
            }}
            transition={{
                type: 'spring',
                stiffness: 300,
                backgroundColor: { duration: 0.2 },
            }}
            onClick={handleClick}
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
                {showVersion && game.latestVersion && ( // Only show version if showVersion is true
                    <div className="text-xs text-text-secondary mb-1">
                        <i className="fas fa-code-branch text-primary mt-1 mr-3 w-5" />
                        Version: v{game.latestVersion}
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">
                        <i className="fas fa-calendar-alt mr-2" />
                        {game.metadata?.releaseYear || game.release_date 
                            ? (game.metadata?.releaseYear || new Date(game.release_date).getFullYear())
                            : 'Unknown'}
                    </span>
                    {game.status && (
                        <span
                            className={`px-2 py-0.5 rounded text-xs ${
                                game.status === 'completed'
                                    ? 'bg-green-500/20 text-green-300'
                                    : game.status === 'downloading'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-gray-500/20 text-gray-300'
                            }`}
                        >
                            {game.status}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}