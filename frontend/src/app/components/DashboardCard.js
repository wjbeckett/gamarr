'use client';
import { motion } from 'framer-motion';

export default function DashboardCard({ title, children }) {
  return (
    <motion.div
      className="bg-card border border-border-dark rounded-lg shadow-lg shadow-black/10"
      animate={{
        backgroundColor: '#1E1E1E', // bg-card color
      }}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: '#252525', // bg-card-hover color
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300,
        backgroundColor: { duration: 0.2 }
      }}
    >
      <div className="p-6">
        <h2 className="text-lg font-medium text-text-primary mb-4">{title}</h2>
        <div className="text-text-secondary">
          {children}
        </div>
      </div>
    </motion.div>
  );
}