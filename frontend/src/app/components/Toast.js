'use client';
import React, { useState, useEffect } from 'react';

export default function Toast({ message, isVisible, onClose }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto-hide after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 bg-card text-text-primary p-4 rounded-lg shadow-lg z-50">
            <p>{message}</p>
        </div>
    );
}