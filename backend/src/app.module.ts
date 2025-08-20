import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { CvModule } from './cv/cv.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    // Load environment variables from .env files
    ConfigModule.forRoot({
      isGlobal: true,
      // Try backend/.env first, then project root .env
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
      ],
    }),
    // Import our custom modules
    CvModule,
    UploadModule,
    SearchModule,
  ],
})
export class AppModule {} 