import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function SettingsModal({ isOpen, onClose, title, children, onSave, onTest }) {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // null, 'success', or 'fail'

    // Reset the test button state when the modal is opened
    useEffect(() => {
        if (isOpen) {
            setIsTesting(false);
            setTestResult(null);
        }
    }, [isOpen]);

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null); // Reset the result while testing
        const result = await onTest(); // Call the test function passed as a prop
        setIsTesting(false);
        setTestResult(result ? 'success' : 'fail');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-6">
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                <div className="space-y-6">{children}</div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-text-secondary rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTest}
                        className={`px-4 py-2 rounded flex items-center space-x-2 ${
                            isTesting
                                ? 'bg-gray-500 text-white'
                                : testResult === 'success'
                                ? 'bg-green-500 text-white'
                                : testResult === 'fail'
                                ? 'bg-red-500 text-white'
                                : 'bg-[#6366f1] text-white hover:bg-[#4f51d9]'
                        }`}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : testResult === 'success' ? (
                            <CheckIcon className="h-5 w-5" />
                        ) : testResult === 'fail' ? (
                            <XMarkIcon className="h-5 w-5" />
                        ) : null}
                        <span>
                            {isTesting
                                ? 'Testing...'
                                : testResult === 'success'
                                ? 'Successful'
                                : testResult === 'fail'
                                ? 'Failed'
                                : 'Test'}
                        </span>
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-[#6366f1] text-white rounded hover:bg-[#4f51d9]"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}