import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Gamarr',
  description: 'Game Download Manager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen">
        {/* Navbar */}
        <Navbar />
        {/* Main Content */}
        <main className="pt-24 px-4 md:px-6 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}