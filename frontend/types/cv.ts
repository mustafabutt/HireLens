// CV metadata structure extracted from PDF
export interface CvMetadata {
  fullName?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  yearsExperience?: number;
  education?: string;
  location?: string;
}

// CV search query structure
export interface CvSearchQuery {
  query: string;
  skills?: string[];
  location?: string;
  minExperience?: number;
  maxExperience?: number;
}

// CV search result structure
export interface CvSearchResultDto {
  id: string;
  filename: string;
  metadata: CvMetadata;
  similarityScore: number;
  uploadDate: Date;
}

// CV upload response structure
export interface CvUploadResponse {
  id: string;
  filename: string;
  message: string;
  metadata?: CvMetadata;
}

// CV entity structure for internal use
export interface CvEntity {
  id: string;
  filename: string;
  filePath: string;
  fullText: string;
  metadata: CvMetadata;
  embedding: number[];
  uploadDate: Date;
  updatedDate: Date;
  fileSize: number;
  status: 'uploaded' | 'processed' | 'indexed' | 'error';
  errorMessage?: string;
} 