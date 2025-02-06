'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function GameCard({ game, onClick }) {
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
            className="bg-card border border-border-dark rounded-lg shadow-lg shadow-black/10 w-full"
            animate={{
                backgroundColor: '#1E1E1E',
            }}
            whileHover={{ 
                scale: 1.02,
                backgroundColor: '#252525',
            }}
            transition={{ 
                type: "spring", 
                stiffness: 300,
                backgroundColor: { duration: 0.2 }
            }}
            onClick={handleClick}
        >
            <div className="relative aspect-[2/3] w-full bg-gray-800 flex items-center justify-center rounded-t-lg overflow-hidden">
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
            
            <div className="p-4">
                <h2 className="text-lg font-bold text-text-primary mb-2 line-clamp-1">{game.name}</h2>
                <div className="text-sm text-text-secondary mb-2">
                    {game.library_name ? `Library: ${game.library_name}` : 'No library assigned'}
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                        {game.releaseDate ? new Date(game.releaseDate).getFullYear() : 'Unknown'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                        game.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        game.status === 'downloading' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                    }`}>
                        {game.status || 'Not Downloaded'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}