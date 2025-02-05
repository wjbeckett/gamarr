'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Library() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h1 className="text-3xl font-bold text-text-primary mb-4">Library</h1>
      <p className="text-text-secondary mb-4">
        Manage your game library and add new games.
      </p>
      <Link
        href="/library/search"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
      >
        Add a New Game
      </Link>
    </motion.div>
  );
}