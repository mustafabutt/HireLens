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
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CvService } from '../cv/cv.service';
import { CvUploadResponseDto } from '../cv/dto/cv.dto';
import { getSupabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Use memory storage; we'll stream to Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype !== 'application/pdf') {
    cb(new BadRequestException('Only PDF files are allowed'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly cvService: CvService) {}

  @Post('cv')
  async uploadSingleCv(
    @Req() req: Request,
    @Res() res: Response,
    @Body('description') description?: string,
  ): Promise<void> {
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

        // 1) Save buffer to a temp file for local PDF parsing
        const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cv-'));
        const tempName = `${uuidv4()}${extname(file.originalname)}`;
        const tempPath = path.join(tempDir, tempName);
        await fs.promises.writeFile(tempPath, file.buffer);

        // 2) Process CV (extract text, embed, index)
        const cvEntity = await this.cvService.processCv(tempPath, file.originalname);

        // 3) Upload original PDF to Supabase Storage
        const supabase = getSupabaseAdmin();
        const bucket = 'cvs';
        const objectPath = `${cvEntity.id}/${tempName}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
        if (upErr) {
          this.logger.error('Supabase upload error:', upErr);
        }
        // 4) Get public URL
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
        const publicUrl = pub?.publicUrl;

        // 5) Save public URL to local file mapping for fallback
        await this.cvService.saveFileMapping(cvEntity.id, publicUrl || tempPath);

        const response: CvUploadResponseDto = {
          id: cvEntity.id,
          filename: cvEntity.filename,
          message: 'CV uploaded and processed successfully',
          metadata: cvEntity.metadata,
        };

        res.json(response);
      } catch (error) {
        this.logger.error(`Error uploading CV:`, error);
        res.status(400).json({ error: 'Failed to upload CV', message: (error as any).message });
      }
    });
  }

  @Post('cv/bulk')
  async uploadBulkCvs(
    @Req() req: Request,
    @Res() res: Response,
    @Body('description') description?: string,
  ): Promise<void> {
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

        const supabase = getSupabaseAdmin();
        const bucket = 'cvs';
        const results: CvUploadResponseDto[] = [];

        for (const file of files) {
          try {
            const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cv-'));
            const tempName = `${uuidv4()}${extname(file.originalname)}`;
            const tempPath = path.join(tempDir, tempName);
            await fs.promises.writeFile(tempPath, file.buffer);

            const cvEntity = await this.cvService.processCv(tempPath, file.originalname);

            const objectPath = `${cvEntity.id}/${tempName}`;
            const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
              contentType: 'application/pdf',
              upsert: true,
            });
            if (upErr) this.logger.error('Supabase upload error:', upErr);
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
            const publicUrl = pub?.publicUrl;
            if (publicUrl) await this.cvService.updateStoredFileUrl(cvEntity.id, publicUrl);
            await this.cvService.saveFileMapping(cvEntity.id, publicUrl || tempPath);

            results.push({
              id: cvEntity.id,
              filename: cvEntity.filename,
              message: 'CV uploaded and processed successfully',
              metadata: cvEntity.metadata,
            });
          } catch (fileError: any) {
            this.logger.error(`Error processing CV ${file.originalname}:`, fileError);
            results.push({ id: uuidv4(), filename: file.originalname, message: `Failed to process CV: ${fileError.message}` });
          }
        }

        res.json(results);
      } catch (error: any) {
        this.logger.error('Error in bulk CV upload:', error);
        res.status(400).json({ error: 'Failed to process bulk upload', message: error.message });
      }
    });
  }

  @Post('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
} 