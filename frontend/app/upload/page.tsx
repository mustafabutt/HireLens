'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { CvUploadResponse } from '../../types/cv';

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<CvUploadResponse[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Handle file drop using react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const newUploads: CvUploadResponse[] = [];

    // Process each file
    for (const file of acceptedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);

        // Upload single file
        const response = await fetch('/api/upload/cv', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          newUploads.push(result);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        newUploads.push({
          id: `error-${Date.now()}`,
          filename: file.name,
          message: `Upload failed: ${errorMessage}`,
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploads]);
    setIsUploading(false);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  // Remove uploaded file from list
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Clear all uploads
  const clearAll = () => {
    setUploadedFiles([]);
    setUploadProgress({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload CVs
          </h1>
          <p className="text-lg text-gray-600">
            Upload PDF CVs to add them to your searchable database
          </p>
        </div>

        {/* Upload Zone */}
        <div className="card mb-8">
          <div className="card-body">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : isDragReject
                  ? 'border-error-400 bg-error-50'
                  : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className={`p-4 rounded-full ${
                    isDragActive ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`h-8 w-8 ${
                      isDragActive ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop files here' : 'Drag & drop CV files here'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to select files
                  </p>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Only PDF files are supported</p>
                    <p>• Maximum file size: 10MB</p>
                    <p>• You can upload multiple files at once</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Progress and Results */}
        {uploadedFiles.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Results
                </h2>
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            </div>
            
            <div className="card-body">
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      file.message.includes('successfully')
                        ? 'border-success-200 bg-success-50'
                        : 'border-error-200 bg-error-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {file.message.includes('successfully') ? (
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-error-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {file.filename}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${
                          file.message.includes('successfully')
                            ? 'text-success-700'
                            : 'text-error-700'
                        }`}>
                          {file.message}
                        </p>
                        
                        {/* Progress bar for successful uploads */}
                        {file.message.includes('successfully') && uploadProgress[file.filename] !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-success-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.filename]}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {isUploading && (
          <div className="card">
            <div className="card-body text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing CVs...</p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments as we extract text and generate embeddings
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              How it works
            </h2>
          </div>
          
          <div className="card-body">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Upload PDF</h3>
                <p className="text-sm text-gray-600">
                  Drag and drop or select PDF CV files from your computer
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">AI Processing</h3>
                <p className="text-sm text-gray-600">
                  Our AI extracts text, parses metadata, and generates searchable embeddings
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Ready to Search</h3>
                <p className="text-sm text-gray-600">
                  CVs become searchable using natural language queries
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 