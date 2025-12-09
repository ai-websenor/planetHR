import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DocumentParserController } from './document-parser.controller';
import { DocumentParserService } from './document-parser.service';
import { GeminiService } from './gemini.service';
import { ParsedDocument, ParsedDocumentSchema } from './schemas/parsed-document.schema';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ParsedDocument.name, schema: ParsedDocumentSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [DocumentParserController],
  providers: [DocumentParserService, GeminiService],
  exports: [DocumentParserService, GeminiService],
})
export class DocumentParserModule {}
