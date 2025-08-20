import { CvMetadataDto } from '../dto/cv.dto';

// Entity representing a CV document in our system
export class CvEntity {
  // Unique identifier for the CV
  id: string;
  
  // Original filename of the uploaded CV
  filename: string;
  
  // Full path to the stored PDF file
  filePath: string;
  
  // Extracted text content from the PDF
  fullText: string;
  
  // Parsed metadata using AI
  metadata: CvMetadataDto;
  
  // Vector embedding for similarity search
  embedding: number[];
  
  // When the CV was uploaded
  uploadDate: Date;
  
  // When the CV was last updated
  updatedDate: Date;
  
  // File size in bytes
  fileSize: number;
  
  // Status of processing (uploaded, processed, indexed)
  status: 'uploaded' | 'processed' | 'indexed' | 'error';
  
  // Any error message if processing failed
  errorMessage?: string;
} 