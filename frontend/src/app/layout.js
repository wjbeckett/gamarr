import './globals.css';
import Sidebar from './components/Sidebar';

export const metadata = {
  title: 'Gamarr',
  description: 'Game Download Manager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}