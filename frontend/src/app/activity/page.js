'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/solid';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function Activity() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [path, setPath] = useState('');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleProcess = async () => {
    try {
      // TODO: Add API call to process path
      console.log(`Processing path: ${path}`);
      setIsModalOpen(false);
      setPath('');
    } catch (error) {
      console.error('Error processing path:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardCard title="Active Tasks">
          <p className="text-sm text-textLight">No tasks currently running.</p>
        </DashboardCard>

        <DashboardCard title="Progress">
          <p className="text-sm text-textLight">No downloads in progress.</p>
        </DashboardCard>

        <DashboardCard title="Quick Actions">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Process Path
          </button>
        </DashboardCard>
      </motion.div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setPath('');
        }}
      >
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Process Path</h2>
          <div className="space-y-2">
            <label htmlFor="path" className="block text-sm font-medium text-gray-700">
              Path to Process
            </label>
            <input
              id="path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/game"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setPath('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={!path.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}