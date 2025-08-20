import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CvService } from '../cv/cv.service';
import { CvSearchDto } from '../cv/dto/cv.dto';

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly cvService: CvService) {}

  /**
   * Main search endpoint for CVs
   * This endpoint accepts natural language queries and returns relevant CVs
   */
  @Post('cv')
  async searchCvs(@Body() searchDto: CvSearchDto): Promise<any[]> {
    try {
      this.logger.log(`Searching CVs with query: ${searchDto.query}`);

      if (!searchDto.query || searchDto.query.trim().length === 0) {
        throw new BadRequestException('Search query is required');
      }

      // Perform the search using the CV service
      const results = await this.cvService.searchCvs(searchDto.query, {
        skills: searchDto.skills,
        location: searchDto.location,
        minExperience: searchDto.minExperience,
        maxExperience: searchDto.maxExperience,
      });

      this.logger.log(`Found ${results.length} matching CVs`);
      return results;

    } catch (error) {
      this.logger.error('Error searching CVs:', error);
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  /**
   * Simple search endpoint using query parameters
   * Useful for simple searches without complex filters
   */
  @Get('cv/simple')
  async simpleSearch(@Query('q') query: string): Promise<any[]> {
    try {
      this.logger.log(`Simple search with query: ${query}`);

      if (!query || query.trim().length === 0) {
        throw new BadRequestException('Search query is required');
      }

      // Perform simple search
      const results = await this.cvService.searchCvs(query);

      this.logger.log(`Found ${results.length} matching CVs`);
      return results;

    } catch (error) {
      this.logger.error('Error in simple search:', error);
      throw new BadRequestException(`Search failed: ${error.message}`);
    }
  }

  /**
   * Health check endpoint for search service
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cv-search',
    };
  }

  /**
   * Get search statistics
   * Useful for monitoring and analytics
   */
  @Get('stats')
  async getSearchStats(): Promise<{ totalCvs: number; lastUpdated: string }> {
    try {
      // This would typically query the database for actual statistics
      // For now, return placeholder data
      return {
        totalCvs: 0, // TODO: Implement actual count
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting search stats:', error);
      throw new BadRequestException('Failed to get search statistics');
    }
  }
} 