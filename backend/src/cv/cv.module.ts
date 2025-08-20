import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

@Module({
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService], // Export service so other modules can use it
})
export class CvModule {} 