import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { DocumentType } from '../schemas/parsed-document.schema';

export class ParseDocumentDto {
  @ApiProperty({
    description: 'URL of the document to parse (supports images and PDFs)',
    example: 'https://example.com/document.pdf',
  })
  @IsString()
  @IsNotEmpty({ message: 'Document URL is required' })
  @IsUrl({ require_tld: false, require_protocol: true }, { message: 'Must be a valid URL starting with http:// or https://' })
  documentUrl: string;

  @ApiPropertyOptional({
    description: 'Type of document being parsed',
    enum: DocumentType,
    example: DocumentType.GST_CERTIFICATE,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiPropertyOptional({
    description: 'Original file name',
    example: 'gst_certificate.pdf',
  })
  @IsOptional()
  @IsString()
  originalFileName?: string;
}

export class ParsedSignatureResponseDto {
  @ApiProperty({ description: 'Signature verification status' })
  signature_status: string;

  @ApiProperty({ description: 'Name of the signer' })
  signed_by: string;

  @ApiProperty({ description: 'Organization name' })
  organization: string;

  @ApiProperty({ description: 'Date of signature (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Time of signature (HH:MM:SS)' })
  time: string;

  @ApiProperty({ description: 'Timezone' })
  timezone: string;
}
