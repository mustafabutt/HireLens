import {
  Controller,
  Post,
  BadRequestException,
  Logger,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as multer from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CvService } from '../cv/cv.service';
import { CvUploadResponseDto } from '../cv/dto/cv.dto';

// Configure multer
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only allow PDF files
  if (file.mimetype !== 'application/pdf') {
    cb(new BadRequestException('Only PDF files are allowed'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly cvService: CvService) {}

  /**
   * Upload a single CV file
   * This endpoint processes one PDF file at a time
   */
  @Post('cv')
  async uploadSingleCv(
    @Req() req: Request,
    @Res() res: Response,
    @Body('description') description?: string,
  ): Promise<void> {
    // Use multer middleware
    upload.single('file')(req, res, async (err) => {
      if (err) {
        this.logger.error('Multer error:', err);
        res.status(400).json({ error: 'File upload failed', message: err.message });
        return;
      }

      try {
        const file = req.file as Express.Multer.File;
        
        if (!file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }

        this.logger.log(`Processing single CV upload: ${file.originalname}`);

        // Process the CV file
        const cvEntity = await this.cvService.processCv(file.path, file.originalname);

        this.logger.log(`Successfully processed CV: ${file.originalname}`);

        const response: CvUploadResponseDto = {
          id: cvEntity.id,
          filename: cvEntity.filename,
          message: 'CV uploaded and processed successfully',
          metadata: cvEntity.metadata,
        };

        res.json(response);

      } catch (error) {
        this.logger.error(`Error uploading CV:`, error);
        res.status(400).json({ error: 'Failed to upload CV', message: error.message });
      }
    });
  }

  /**
   * Upload multiple CV files at once
   * This endpoint processes multiple PDF files in bulk
   */
  @Post('cv/bulk')
  async uploadBulkCvs(
    @Req() req: Request,
    @Res() res: Response,
    @Body('description') description?: string,
  ): Promise<void> {
    // Use multer middleware for multiple files
    upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        this.logger.error('Multer error:', err);
        res.status(400).json({ error: 'File upload failed', message: err.message });
        return;
      }

      try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          res.status(400).json({ error: 'No files uploaded' });
          return;
        }

        if (files.length > 10) {
          res.status(400).json({ error: 'Maximum 10 files allowed per upload' });
          return;
        }

        this.logger.log(`Processing bulk CV upload: ${files.length} files`);

        const results: CvUploadResponseDto[] = [];

        // Process each file sequentially to avoid overwhelming the AI services
        for (const file of files) {
          try {
            this.logger.log(`Processing CV: ${file.originalname}`);
            
            // Process the CV file
            const cvEntity = await this.cvService.processCv(file.path, file.originalname);

            results.push({
              id: cvEntity.id,
              filename: cvEntity.filename,
              message: 'CV uploaded and processed successfully',
              metadata: cvEntity.metadata,
            });

            this.logger.log(`Successfully processed CV: ${file.originalname}`);

          } catch (fileError) {
            this.logger.error(`Error processing CV ${file.originalname}:`, fileError);
            
            // Add error result but continue processing other files
            results.push({
              id: uuidv4(),
              filename: file.originalname,
              message: `Failed to process CV: ${fileError.message}`,
            });
          }
        }

        this.logger.log(`Bulk upload completed. Processed: ${results.length} files`);
        res.json(results);

      } catch (error) {
        this.logger.error('Error in bulk CV upload:', error);
        res.status(400).json({ error: 'Failed to process bulk upload', message: error.message });
      }
    });
  }

  /**
   * Health check endpoint for upload service
   */
  @Post('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
} 