import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  private readonly maxFileSizeMB = 10;

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'planetshr',
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary upload error: ${error.message}`);
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else if (result) {
            this.logger.log(`File uploaded successfully: ${result.public_id}`);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload file from base64 string
   */
  async uploadBase64(
    base64Data: string,
    folder: string = 'planetshr',
    fileName?: string,
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: 'auto',
        public_id: fileName,
      });

      this.logger.log(`Base64 file uploaded successfully: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary base64 upload error: ${error.message}`);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted: ${publicId}, result: ${result.result}`);
      return result.result === 'ok';
    } catch (error: any) {
      this.logger.error(`Cloudinary delete error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get optimized URL for image
   */
  getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): string {
    return cloudinary.url(publicId, {
      width: options?.width,
      height: options?.height,
      quality: options?.quality || 'auto',
      fetch_format: options?.format || 'auto',
      crop: 'fill',
    });
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.maxFileSizeMB) {
      throw new BadRequestException(
        `File size exceeds ${this.maxFileSizeMB}MB limit`,
      );
    }
  }
}
