import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CvService } from './cv.service';
import { CvSearchDto, CvSearchResultDto } from './dto/cv.dto';

@Controller('cv')
export class CvController {
  private readonly logger = new Logger(CvController.name);

  constructor(private readonly cvService: CvService) {}

  /**
   * Search for CVs using natural language query and optional filters
   * This is the main search endpoint that HR teams will use
   */
  @Get('search')
  async searchCvs(@Body() searchDto: CvSearchDto): Promise<CvSearchResultDto[]> {
    try {
      this.logger.log(`Searching CVs with query: ${searchDto.query}`);

      // Extract filters from the search query
      const filters = this.extractFiltersFromQuery(searchDto.query);
      
      // Perform the search
      const results = await this.cvService.searchCvs(searchDto.query, filters);

      this.logger.log(`Found ${results.length} matching CVs`);
      return results;

    } catch (error) {
      this.logger.error('Error searching CVs:', error);
      throw new BadRequestException('Failed to search CVs');
    }
  }

  /**
   * Download a specific CV file by ID
   * HR teams can use this to download the original PDF
   */
  @Get('download/:id')
  async downloadCv(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      this.logger.log(`Downloading CV with ID: ${id}`);

      // Get the file path for the CV from Pinecone metadata; fallbacks to local map and legacy path
      let filePath = await this.cvService.getCvFilePathFromIndex(id);
      if (!filePath) {
        filePath = await this.cvService.getFilePathFromLocalMap(id);
      }
      if (!filePath) {
        filePath = this.cvService.getCvFilePath(id);
      }
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('CV file not found');
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cv-${id}.pdf"`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      this.logger.error(`Error downloading CV ${id}:`, error);
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Failed to download CV',
        message: error.message,
      });
    }
  }

  /**
   * Get CV metadata by ID
   * Useful for displaying CV details without downloading
   */
  @Get(':id')
  async getCvMetadata(@Param('id') id: string): Promise<any> {
    try {
      this.logger.log(`Getting metadata for CV: ${id}`);

      // This would typically query the database for CV metadata
      // For now, we'll return a placeholder response
      return {
        id,
        message: 'CV metadata endpoint - implement database query here',
      };

    } catch (error) {
      this.logger.error(`Error getting CV metadata ${id}:`, error);
      throw new BadRequestException('Failed to get CV metadata');
    }
  }

  /**
   * Extract structured filters from natural language query
   * This helps improve search accuracy by parsing location, experience, skills, etc.
   */
  private extractFiltersFromQuery(query: string): any {
    const filters: any = {};
    const lowerQuery = query.toLowerCase();

    // Extract location mentions (common cities, countries)
    const locationPatterns = [
      /(?:in|from|based in|located in)\s+([a-zA-Z\s,]+?)(?:\s+with|\s+and|\s+experience|$)/gi,
      /([a-zA-Z\s,]+?)(?:\s+developer|\s+engineer|\s+manager|\s+specialist)/gi,
    ];

    for (const pattern of locationPatterns) {
      const match = pattern.exec(query);
      if (match && match[1]) {
        const location = match[1].trim();
        if (location.length > 2 && location.length < 50) {
          filters.location = location;
          break;
        }
      }
    }

    // Extract experience requirements
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*experience/gi,
      /experience:\s*(\d+)\+?/gi,
      /(\d+)\+?\s*years?\s*in/gi,
    ];

    for (const pattern of experiencePatterns) {
      const match = pattern.exec(query);
      if (match && match[1]) {
        const years = parseInt(match[1]);
        if (years > 0 && years < 50) {
          filters.minExperience = years;
          break;
        }
      }
    }

    // Extract skill mentions
    const skillPatterns = [
      /(?:with|using|knowledge of|experience in)\s+([a-zA-Z\s,+#]+?)(?:\s+and|\s+experience|$)/gi,
      /([a-zA-Z\s,+#]+?)(?:\s+developer|\s+engineer|\s+specialist)/gi,
    ];

    const skills: string[] = [];
    for (const pattern of skillPatterns) {
      const matches = query.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const skillText = match[1].trim();
          // Split by common delimiters and clean up
          const skillList = skillText.split(/[,&and]/).map(s => s.trim()).filter(s => s.length > 1);
          skills.push(...skillList);
        }
      }
    }

    if (skills.length > 0) {
      filters.skills = skills.slice(0, 5); // Limit to 5 skills
    }

    return filters;
  }
} 