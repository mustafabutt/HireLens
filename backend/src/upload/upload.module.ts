import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [CvModule], // Import CV module to use CvService
  controllers: [UploadController],
})
export class UploadModule {} 