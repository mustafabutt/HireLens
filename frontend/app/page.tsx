'use client';

import { useState } from 'react';
import { Search, Filter, Download, User, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import CvSearchResults from '../components/CvSearchResults';
import { CvSearchResultDto } from '../types/cv';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CvSearchResultDto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/search/cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Example search queries for quick access
  const exampleQueries = [
    'React developer in Toronto with 5+ years experience',
    'Python developer with machine learning skills',
    'Frontend developer in New York',
    'DevOps engineer with AWS experience',
    'Product manager with 3+ years experience',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find the Perfect Candidate
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Use natural language to search through CVs with AI-powered intelligence
            </p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., React developer in Toronto with 5+ years experience"
                    className="w-full pl-10 pr-4 py-4 text-lg text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    disabled={isSearching}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="btn-primary px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search CVs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Example Queries */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Try these example searches
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(query)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Search Results
            </h2>
            <p className="text-gray-600">
              {isSearching 
                ? 'Searching for relevant CVs...' 
                : `Found ${searchResults.length} matching CV${searchResults.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          
          {!isSearching && (
            <CvSearchResults results={searchResults} />
          )}
        </div>
      )}

      {/* Features Section */}
      {!hasSearched && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CV Search?
            </h2>
            <p className="text-xl text-gray-600">
              Powerful AI technology that understands your hiring needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Natural Language Search
              </h3>
              <p className="text-gray-600">
                Search using everyday language. No need to learn complex search syntax.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-success-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Filter className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Filtering
              </h3>
              <p className="text-gray-600">
                AI automatically detects skills, experience, and location from your queries.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-warning-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Download className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Access
              </h3>
              <p className="text-gray-600">
                Download original CVs and view extracted information instantly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 