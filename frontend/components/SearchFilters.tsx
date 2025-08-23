'use client';

import React, { useState } from 'react';

export interface SearchFilters {
  skills: string[];
  location: string;
  education: string;
  minExperience: number;
  maxExperience: number;
  sortBy: 'relevance' | 'experience' | 'uploadDate';
  sortOrder: 'asc' | 'desc';
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange, onClearFilters }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    skills: [],
    location: '',
    education: '',
    minExperience: 0,
    maxExperience: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  // Predefined options for dropdowns
  const skillOptions = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
    'TypeScript', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
    'Machine Learning', 'Data Science', 'DevOps', 'UI/UX Design', 'Project Management'
  ];

  const locationOptions = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Sialkot', 'Gujranwala', 'Peshawar', 'Quetta', 'Remote', 'Hybrid'
  ];

  const educationOptions = [
    'High School', 'Diploma', 'Associate Degree', 'Bachelor\'s Degree',
    'Master\'s Degree', 'PhD', 'Certification', 'Bootcamp'
  ];

  const experienceOptions = Array.from({ length: 21 }, (_, i) => i);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    handleFilterChange('skills', newSkills);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      skills: [],
      location: '',
      education: '',
      minExperience: 0,
      maxExperience: 20,
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = filters.skills.length > 0 || 
                          filters.location || 
                          filters.education || 
                          filters.minExperience > 0 || 
                          filters.maxExperience < 20;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Search Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-2">
            {filters.skills.map(skill => (
              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {skill}
              </span>
            ))}
            {filters.location && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Location: {filters.location}
              </span>
            )}
            {filters.education && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Education: {filters.education}
              </span>
            )}
            {(filters.minExperience > 0 || filters.maxExperience < 20) && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Experience: {filters.minExperience}-{filters.maxExperience} years
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filters - Always visible in sidebar */}
      <div className="space-y-6">
        {/* Skills Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Skills
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
            {skillOptions.map(skill => (
              <label key={skill} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.skills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{skill}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Location</option>
            {locationOptions.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        {/* Education Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Level
          </label>
          <select
            value={filters.education}
            onChange={(e) => handleFilterChange('education', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Education</option>
            {educationOptions.map(education => (
              <option key={education} value={education}>{education}</option>
            ))}
          </select>
        </div>

        {/* Experience Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <select
                value={filters.minExperience}
                onChange={(e) => handleFilterChange('minExperience', parseInt(e.target.value))}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {experienceOptions.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <select
                value={filters.maxExperience}
                onChange={(e) => handleFilterChange('maxExperience', parseInt(e.target.value))}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {experienceOptions.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="space-y-2">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="experience">Experience</option>
              <option value="uploadDate">Upload Date</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters; 