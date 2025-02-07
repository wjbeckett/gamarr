'use client';

export default function MediaManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border-dark pb-4">
        <h1 className="text-2xl font-semibold">Game Management</h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Game Naming */}
        <section className="bg-card rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border-dark pb-2">
            Game Naming
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-400" />
                  <span>Rename Games</span>
                </label>
                <p className="text-sm text-text-secondary mt-1">
                  Gamarr will use the existing file name if renaming is disabled
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-400" />
                  <span>Replace Illegal Characters</span>
                </label>
                <p className="text-sm text-text-secondary mt-1">
                  Replace illegal characters. If unchecked, Gamarr will remove them instead
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* File Management */}
        <section className="bg-card rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border-dark pb-2">
            File Management
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-400" />
                  <span>Unmonitor Deleted Games</span>
                </label>
                <p className="text-sm text-text-secondary mt-1">
                  Games deleted from disk are automatically unmonitored in Gamarr
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}