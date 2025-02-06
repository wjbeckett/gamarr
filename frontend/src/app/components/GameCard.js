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
            className="bg-card border border-border-dark rounded-lg shadow-lg shadow-black/10"
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
            <div className="relative h-48 w-full bg-gray-800 flex items-center justify-center">
                {game.cover_url ? (
                    <img
                        src={game.cover_url}
                        alt={game.name}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <span className="text-gray-500 text-sm">No Image Available</span>
                )}
            </div>
            
            <div className="p-4">
                <h2 className="text-xl font-bold text-text-primary mb-2">{game.name}</h2>
                {game.releaseDate && (
                    <p className="text-sm text-text-secondary mb-2">
                        Released: {new Date(game.releaseDate).getFullYear()}
                    </p>
                )}
                <p className="text-text-secondary mb-4 line-clamp-3">
                    {game.description || 'No description available.'}
                </p>
            </div>
        </motion.div>
    );
}