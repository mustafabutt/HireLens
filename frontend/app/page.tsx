'use client';

import React, { useState } from 'react';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import CvSearchResults from '../components/CvSearchResults';
import SearchFilters, { SearchFilters as SearchFiltersType } from '../components/SearchFilters';
import { CvSearchResultDto } from '../types/cv';

export default function Home() {
  const [searchResults, setSearchResults] = useState<CvSearchResultDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentFilters, setCurrentFilters] = useState<SearchFiltersType>({
    skills: [],
    location: '',
    education: '',
    minExperience: 0,
    maxExperience: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const handleSearch = async (query: string, filters: SearchFiltersType) => {
    setIsLoading(true);
    setCurrentQuery(query);
    setCurrentFilters(filters);

    try {
      // Build the search request with filters
      const searchRequest: any = {
        query,
        ...(filters.skills.length > 0 && { skills: filters.skills }),
        ...(filters.location && { location: filters.location }),
        ...(filters.education && { education: filters.education }),
        ...(filters.minExperience > 0 && { minExperience: filters.minExperience }),
        ...(filters.maxExperience < 20 && { maxExperience: filters.maxExperience }),
        ...(filters.sortBy !== 'relevance' && { sortBy: filters.sortBy }),
        ...(filters.sortOrder !== 'desc' && { sortOrder: filters.sortOrder }),
      };

      const response = await fetch('/api/search/cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setCurrentQuery('');
    setCurrentFilters({
      skills: [],
      location: '',
      education: '',
      minExperience: 0,
      maxExperience: 20,
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const handleFiltersChange = (filters: SearchFiltersType) => {
    setCurrentFilters(filters);
    // Auto-search when filters change if there's a current query
    if (currentQuery.trim()) {
      handleSearch(currentQuery.trim(), filters);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              HireLens
            </h1>
            <p className="text-xl text-gray-600">
              AI-Powered CV Search & Candidate Discovery
            </p>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8">
              <SearchFilters
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearSearch}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Search Section */}
            <div className="mb-6">
              <EnhancedSearchBar
                onSearch={handleSearch}
                onClearSearch={handleClearSearch}
                hideFilters={true} // Hide filters since they're now in sidebar
              />
            </div>

            {/* Results Section - Displayed immediately below search */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-blue-600 bg-blue-100 rounded-md">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching for candidates...
                </div>
              </div>
            )}

            {!isLoading && searchResults.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Search Results
                  </h2>
                  <div className="text-sm text-gray-600">
                    Found {searchResults.length} candidate{searchResults.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Search Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-blue-800">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="font-medium">Search Query:</span>
                    <span>"{currentQuery}"</span>
                    {currentFilters.skills.length > 0 && (
                      <>
                        <span className="font-medium">• Skills:</span>
                        <span>{currentFilters.skills.join(', ')}</span>
                      </>
                    )}
                    {currentFilters.location && (
                      <>
                        <span className="font-medium">• Location:</span>
                        <span>{currentFilters.location}</span>
                      </>
                    )}
                    {currentFilters.education && (
                      <>
                        <span className="font-medium">• Education:</span>
                        <span>{currentFilters.education}</span>
                      </>
                    )}
                    {(currentFilters.minExperience > 0 || currentFilters.maxExperience < 20) && (
                      <>
                        <span className="font-medium">• Experience:</span>
                        <span>{currentFilters.minExperience}-{currentFilters.maxExperience} years</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isLoading && searchResults.length === 0 && currentQuery && (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria or filters to find more results.
                  </p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <CvSearchResults results={searchResults} />
            )}

            {/* Welcome Message */}
            {!isLoading && searchResults.length === 0 && !currentQuery && (
              <div className="text-center py-12">
                <div className="max-w-2xl mx-auto">
                  <svg className="mx-auto h-16 w-16 text-blue-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Find Your Perfect Candidate
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Use the search bar above to find candidates by skills, experience, education, or location. 
                    Our AI-powered search will help you discover the best talent for your team.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="text-center">
                      <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Search</h3>
                      <p className="text-gray-600 text-sm">Advanced AI algorithms understand context and find relevant candidates</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Smart Filters</h3>
                      <p className="text-gray-600 text-sm">Filter by skills, experience, education, and location</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Instant Results</h3>
                      <p className="text-gray-600 text-sm">Get search results instantly with our optimized search engine</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 