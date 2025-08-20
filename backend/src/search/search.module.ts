import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [CvModule], // Import CV module to use CvService
  controllers: [SearchController],
})
export class SearchModule {} 