import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function SettingsCard({ title, details, onEdit, onDelete }) {
    return (
        <div className="bg-card shadow-md rounded-lg p-4 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary">{details}</p>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={onEdit}
                    className="p-2 bg-[#6366f1] text-white rounded hover:bg-[#4f51d9]"
                >
                    <PencilIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}