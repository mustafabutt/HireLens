'use client';

import React, { useState, useEffect, useRef } from 'react';
import SearchFilters, { SearchFilters as SearchFiltersType } from './SearchFilters';

interface EnhancedSearchBarProps {
  onSearch: (query: string, filters: SearchFiltersType) => void;
  onClearSearch: () => void;
  hideFilters?: boolean; // New prop to hide filters when they're in sidebar
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ onSearch, onClearSearch, hideFilters = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>({
    skills: [],
    location: '',
    education: '',
    minExperience: 0,
    maxExperience: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick search suggestions
  const quickSearches = [
    'JavaScript developers',
    'Python engineers',
    'React developers',
    'Senior developers',
    'Remote workers',
    'Karachi based',
    'Computer Science graduates',
    '5+ years experience'
  ];

  useEffect(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem('cv-search-history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Handle click outside to close history dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const saveToHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('cv-search-history', JSON.stringify(newHistory));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim());
      setShowHistory(false); // Hide history after search
      onSearch(searchQuery.trim(), filters);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    saveToHistory(query);
    setShowHistory(false); // Hide history after selection
    onSearch(query, filters);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setFilters({
      skills: [],
      location: '',
      education: '',
      minExperience: 0,
      maxExperience: 20,
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
    setShowHistory(false); // Hide history when clearing
    onClearSearch();
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    // Auto-search when filters change
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), newFilters);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowHistory(false)} // Hide history when focusing on input
              placeholder="Search for candidates, skills, experience, education..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Search
          </button>
          
          {/* Only show filters toggle if filters are not hidden */}
          {!hideFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
          )}
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div 
            ref={historyRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Recent Searches</div>
              {searchHistory.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(query)}
                  className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center space-x-2"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{query}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Search Suggestions */}
      <div className="flex flex-wrap gap-2">
        {quickSearches.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleQuickSearch(suggestion)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Advanced Filters - Only show if not hidden and expanded */}
      {!hideFilters && showFilters && (
        <SearchFilters
          onFiltersChange={handleFiltersChange}
          onClearFilters={() => {
            setFilters({
              skills: [],
              location: '',
              education: '',
              minExperience: 0,
              maxExperience: 20,
              sortBy: 'relevance',
              sortOrder: 'desc',
            });
            onClearSearch();
          }}
        />
      )}

      {/* Search Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleHistory}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </button>
          
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {searchQuery && `Searching for: "${searchQuery}"`}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchBar; 