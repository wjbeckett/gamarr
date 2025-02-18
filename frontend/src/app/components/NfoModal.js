export default function NfoModal({ isOpen, onClose, content }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-3xl w-full m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">NFO File</h3>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Parsed Content */}
                {content?.parsed && (
                    <div className="mb-4 space-y-4">
                        {content.parsed.patchNotes && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Patch Notes</h4>
                                <p className="text-text-primary">{content.parsed.patchNotes}</p>
                            </div>
                        )}

                        {content.parsed.requiredReleases.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Required Releases</h4>
                                <ul className="list-disc pl-4 text-text-primary">
                                    {content.parsed.requiredReleases.map((release, index) => (
                                        <li key={index}>{release}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {content.parsed.installInstructions.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Install Instructions</h4>
                                <ol className="list-decimal pl-4 text-text-primary">
                                    {content.parsed.installInstructions.map((instruction, index) => (
                                        <li key={index}>{instruction}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {/* Raw Content */}
                <div className="mt-4 border-t border-border-dark pt-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Raw NFO Content</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded overflow-auto max-h-96 text-sm">
                        {content?.raw || 'No NFO content available.'}
                    </pre>
                </div>
            </div>
        </div>
    );
}