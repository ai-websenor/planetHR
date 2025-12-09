import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const execPromise = promisify(exec);

export interface ParsedSignatureData {
  signature_status: string;
  signed_by: string;
  organization: string;
  date: string;
  time: string;
  timezone: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not configured! Document parsing will fail.');
    } else {
      this.logger.log(`OPENAI_API_KEY configured (starts with: ${apiKey.substring(0, 15)}...)`);
    }
    this.openai = new OpenAI({ apiKey: apiKey || '' });
  }

  /**
   * Convert PDF to PNG image using pdftoppm (Poppler)
   */
  private async convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
    const tempDir = path.join(os.tmpdir(), `pdf-convert-${Date.now()}`);
    const pdfPath = path.join(tempDir, 'input.pdf');
    const outputPrefix = path.join(tempDir, 'output');

    try {
      await mkdir(tempDir, { recursive: true });
      await writeFile(pdfPath, pdfBuffer);

      this.logger.log('Converting PDF to PNG using pdftoppm...');

      // Use pdftoppm to convert first page to PNG
      await execPromise(`pdftoppm -png -f 1 -l 1 -r 150 "${pdfPath}" "${outputPrefix}"`);

      // Read the output image (pdftoppm adds -1 suffix for first page)
      const imagePath = `${outputPrefix}-1.png`;

      if (!fs.existsSync(imagePath)) {
        throw new Error('PDF conversion failed - no output image created');
      }

      const imageBuffer = await readFile(imagePath);
      this.logger.log(`PDF converted to PNG (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

      // Cleanup
      try {
        await unlink(pdfPath);
        await unlink(imagePath);
        fs.rmdirSync(tempDir);
      } catch (e) {
        // Ignore cleanup errors
      }

      return imageBuffer;
    } catch (error) {
      // Cleanup on error
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (e) {
        // Ignore
      }
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Parse document from buffer using OpenAI Vision API
   * Supports both images (direct) and PDFs (converted to image first)
   */
  async parseDocumentFromBuffer(
    buffer: Buffer,
    mimeType: string,
    originalFileName?: string,
  ): Promise<ParsedSignatureData> {
    this.logger.log(`[parseDocumentFromBuffer] Starting document parsing...`);
    this.logger.log(`File: ${originalFileName || 'unknown'}, MIME: ${mimeType}, Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    try {
      let imageBuffer: Buffer;
      let imageMimeType: string;

      // Check if it's a PDF - convert to image first
      if (mimeType === 'application/pdf' || originalFileName?.toLowerCase().endsWith('.pdf')) {
        this.logger.log('PDF detected - converting to image...');
        imageBuffer = await this.convertPdfToImage(buffer);
        imageMimeType = 'image/png';
      } else {
        // Already an image
        imageBuffer = buffer;
        imageMimeType = mimeType;
      }

      const base64 = imageBuffer.toString('base64');

      this.logger.log('Sending to OpenAI GPT-4o Vision API...');

      const prompt = `You are an OCR and structured data extraction assistant.

Extract and return only the following details from the highlighted signature section of the provided document:

- Signature Status (Example: Verified / Not Verified)
- Signed By (Name of signer or authority)
- Organization (Example: GOODS AND SERVICES TAX NETWORK)
- Date (Format: YYYY-MM-DD)
- Time (Format: HH:MM:SS)
- Time Zone (Example: IST)

Return the extracted data in the following JSON format only, with no additional text:

{
  "signature_status": "",
  "signed_by": "",
  "organization": "",
  "date": "",
  "time": "",
  "timezone": ""
}

If any field cannot be found, use an empty string for that field.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const text = response.choices[0]?.message?.content || '';

      this.logger.log('OpenAI responded successfully');
      this.logger.log(`Raw response:\n${text}`);

      const parsedData = this.extractJsonFromResponse(text);

      this.logger.log(`Extracted signature data:`);
      this.logger.log(`   - Status: ${parsedData.signature_status || '(empty)'}`);
      this.logger.log(`   - Signed By: ${parsedData.signed_by || '(empty)'}`);
      this.logger.log(`   - Organization: ${parsedData.organization || '(empty)'}`);
      this.logger.log(`   - Date: ${parsedData.date || '(empty)'}`);
      this.logger.log(`   - Time: ${parsedData.time || '(empty)'}`);
      this.logger.log(`   - Timezone: ${parsedData.timezone || '(empty)'}`);

      return parsedData;
    } catch (error) {
      this.logger.error(`[parseDocumentFromBuffer] Error: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Parse document to extract signature details using OpenAI Vision (from URL - for images only)
   */
  async parseDocumentForSignature(documentUrl: string): Promise<ParsedSignatureData> {
    this.logger.log(`[parseDocumentForSignature] Starting document parsing...`);
    this.logger.log(`Document URL: ${documentUrl}`);

    try {
      this.logger.log('Sending to OpenAI GPT-4o for analysis...');

      const prompt = `You are an OCR and structured data extraction assistant.

Extract and return only the following details from the highlighted signature section of the provided document:

- Signature Status (Example: Verified / Not Verified)
- Signed By (Name of signer or authority)
- Organization (Example: GOODS AND SERVICES TAX NETWORK)
- Date (Format: YYYY-MM-DD)
- Time (Format: HH:MM:SS)
- Time Zone (Example: IST)

Return the extracted data in the following JSON format only, with no additional text:

{
  "signature_status": "",
  "signed_by": "",
  "organization": "",
  "date": "",
  "time": "",
  "timezone": ""
}

If any field cannot be found, use an empty string for that field.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: documentUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const text = response.choices[0]?.message?.content || '';

      this.logger.log('OpenAI responded successfully');
      this.logger.log(`Raw response:\n${text}`);

      const parsedData = this.extractJsonFromResponse(text);

      this.logger.log(`Extracted signature data:`);
      this.logger.log(`   - Status: ${parsedData.signature_status || '(empty)'}`);
      this.logger.log(`   - Signed By: ${parsedData.signed_by || '(empty)'}`);
      this.logger.log(`   - Organization: ${parsedData.organization || '(empty)'}`);
      this.logger.log(`   - Date: ${parsedData.date || '(empty)'}`);
      this.logger.log(`   - Time: ${parsedData.time || '(empty)'}`);
      this.logger.log(`   - Timezone: ${parsedData.timezone || '(empty)'}`);

      return parsedData;
    } catch (error) {
      this.logger.error(`[parseDocumentForSignature] Error: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Extract JSON from OpenAI response (handles markdown code blocks)
   */
  private extractJsonFromResponse(text: string): ParsedSignatureData {
    const defaultResponse: ParsedSignatureData = {
      signature_status: '',
      signed_by: '',
      organization: '',
      date: '',
      time: '',
      timezone: '',
    };

    try {
      let cleanedText = text.trim();

      // Handle ```json ... ``` format
      const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch) {
        cleanedText = jsonBlockMatch[1].trim();
      }

      // Try to find JSON object in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          signature_status: parsed.signature_status || '',
          signed_by: parsed.signed_by || '',
          organization: parsed.organization || '',
          date: parsed.date || '',
          time: parsed.time || '',
          timezone: parsed.timezone || 'IST',
        };
      }

      return defaultResponse;
    } catch (error) {
      this.logger.error(`[extractJsonFromResponse] Failed to parse JSON: ${error.message}`);
      return defaultResponse;
    }
  }
}
