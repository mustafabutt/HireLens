import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CV Search - AI-Powered HR Tool',
  description: 'Search and filter CVs using natural language queries powered by AI',
  keywords: 'CV search, HR tool, AI, recruitment, candidate search',
  authors: [{ name: 'CV Search Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gradient">
                    CV Search
                  </h1>
                </div>
                <div className="ml-4 text-sm text-gray-500">
                  AI-Powered HR Tool
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <a
                  href="/"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Search
                </a>
                <a
                  href="/upload"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Upload CVs
                </a>
                <a
                  href="/about"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  About
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; 2024 CV Search. Built with Next.js, NestJS, and AI.</p>
              <p className="mt-2">
                Powered by OpenAI and Pinecone for intelligent CV search and analysis.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
} 