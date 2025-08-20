import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  minExperience?: number;

  @IsNumber()
  @IsOptional()
  maxExperience?: number;
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