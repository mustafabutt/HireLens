'use client';

import { useState } from 'react';
import { Download, User, MapPin, Briefcase, GraduationCap, Star, Calendar, Search } from 'lucide-react';
import { CvSearchResultDto } from '../types/cv';

interface CvSearchResultsProps {
  results: CvSearchResultDto[];
}

export default function CvSearchResults({ results }: CvSearchResultsProps) {
  const [expandedCv, setExpandedCv] = useState<string | null>(null);

  // Handle CV download
  const handleDownload = async (cvId: string, filename: string) => {
    try {
      const response = await fetch(`/api/cv/download/${cvId}`);
      if (response.ok) {
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `cv-${cvId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Toggle CV details expansion
  const toggleExpanded = (cvId: string) => {
    setExpandedCv(expandedCv === cvId ? null : cvId);
  };

  // Format similarity score as percentage
  const formatScore = (score: number) => {
    return Math.round(score * 100);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No CVs Found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search query or check if CVs have been uploaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((cv) => (
        <div key={cv.id} className="card hover:shadow-md transition-shadow">
          <div className="card-body">
            {/* CV Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {cv.metadata.fullName || 'Unknown Candidate'}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700">
                      {formatScore(cv.similarityScore)}% match
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {cv.metadata.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {cv.metadata.location}
                    </div>
                  )}
                  {cv.metadata.yearsExperience && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {cv.metadata.yearsExperience} years experience
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(cv.uploadDate)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDownload(cv.id, cv.filename)}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download CV
              </button>
            </div>

            {/* Skills */}
            {cv.metadata.skills && cv.metadata.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {cv.metadata.skills.map((skill, index) => (
                    <span key={index} className="badge-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.metadata.education && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </h4>
                <p className="text-gray-600">{cv.metadata.education}</p>
              </div>
            )}

            {/* Contact Information */}
            {(cv.metadata.email || cv.metadata.phone) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {cv.metadata.email && <p>Email: {cv.metadata.email}</p>}
                  {cv.metadata.phone && <p>Phone: {cv.metadata.phone}</p>}
                </div>
              </div>
            )}

            {/* Expandable Details */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => toggleExpanded(cv.id)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              >
                {expandedCv === cv.id ? 'Show less' : 'Show more details'}
                <svg
                  className={`h-4 w-4 transition-transform ${
                    expandedCv === cv.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedCv === cv.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Filename:</span>
                      <p className="text-gray-600">{cv.filename}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">CV ID:</span>
                      <p className="text-gray-600 font-mono">{cv.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Similarity Score:</span>
                      <p className="text-gray-600">{cv.similarityScore.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Upload Date:</span>
                      <p className="text-gray-600">{cv.uploadDate.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 