'use client';
import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <h1 className="text-2xl font-bold text-text-primary mb-4">Settings</h1>
      <p className="text-text-secondary">Configure your Gamarr settings here.</p>
    </motion.div>
  );
}