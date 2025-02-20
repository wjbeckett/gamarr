import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function SettingsCard({ title, details, onEdit, onDelete }) {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-gray-600">{details}</p>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={onEdit}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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