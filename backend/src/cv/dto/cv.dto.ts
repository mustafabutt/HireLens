import { IsString, IsOptional, IsArray, IsNumber, IsIn } from 'class-validator';

// DTO for CV metadata extracted from PDF
export class CvMetadataDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsNumber()
  @IsOptional()
  yearsExperience?: number;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

// DTO for CV search query
export class CvSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsNumber()
  minExperience?: number;

  @IsOptional()
  @IsNumber()
  maxExperience?: number;

  @IsOptional()
  @IsIn(['relevance', 'experience', 'uploadDate'])
  sortBy?: 'relevance' | 'experience' | 'uploadDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// DTO for CV search response
export class CvSearchResultDto {
  id: string;
  filename: string;
  metadata: CvMetadataDto;
  similarityScore: number;
  uploadDate: Date;
}

// DTO for CV upload response
export class CvUploadResponseDto {
  id: string;
  filename: string;
  message: string;
  metadata?: CvMetadataDto;
} 