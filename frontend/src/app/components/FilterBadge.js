'use client';

export default function FilterBadge({ label, onClear }) {
    return (
        <div className="inline-flex items-center bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
            <span className="mr-2">{label}</span>
            <button
                onClick={onClear}
                className="hover:text-white transition-colors"
            >
                <i className="fas fa-times" />
            </button>
        </div>
    );
}