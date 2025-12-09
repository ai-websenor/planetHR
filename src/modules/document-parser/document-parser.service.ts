import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ParsedDocument, DocumentType, SignatureStatus } from './schemas/parsed-document.schema';
import { Organization } from '../organizations/schemas/organization.schema';
import { GeminiService } from './gemini.service';
import { ParseDocumentDto } from './dto/parse-document.dto';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  constructor(
    @InjectModel(ParsedDocument.name)
    private readonly parsedDocumentModel: Model<ParsedDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Parse a document and extract signature details
   */
  async parseDocument(
    organizationId: string,
    dto: ParseDocumentDto,
  ): Promise<ParsedDocument> {
    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`📋 DOCUMENT PARSING REQUEST`);
    this.logger.log(`${'='.repeat(60)}`);
    this.logger.log(`🏢 Organization ID: ${organizationId}`);
    this.logger.log(`📄 Document URL: ${dto.documentUrl}`);
    this.logger.log(`📁 Document Type: ${dto.documentType || 'OTHER'}`);
    this.logger.log(`📝 Original Filename: ${dto.originalFileName || '(not provided)'}`);

    // Verify organization exists
    this.logger.log(`\n🔍 Verifying organization exists...`);
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) {
      this.logger.error(`❌ Organization not found: ${organizationId}`);
      throw new NotFoundException('Organization not found');
    }
    this.logger.log(`✅ Organization found: ${organization.name}`);

    // Create initial parsed document record
    this.logger.log(`\n📝 Creating parsed document record...`);
    const parsedDocument = new this.parsedDocumentModel({
      organization: new Types.ObjectId(organizationId),
      documentType: dto.documentType || DocumentType.OTHER,
      documentUrl: dto.documentUrl,
      originalFileName: dto.originalFileName || '',
      parsingSuccessful: false,
    });
    this.logger.log(`✅ Document record created with temp ID`);

    try {
      // Call Gemini to parse the document
      this.logger.log(`\n🤖 Calling Gemini AI to parse document...`);
      const parsedData = await this.geminiService.parseDocumentForSignature(
        dto.documentUrl,
      );

      // Map the parsed data to our schema
      this.logger.log(`\n📊 Mapping parsed data to schema...`);
      parsedDocument.signatureDetails = {
        signatureStatus: this.mapSignatureStatus(parsedData.signature_status),
        signedBy: parsedData.signed_by,
        organization: parsedData.organization,
        date: parsedData.date ? new Date(parsedData.date) : undefined,
        time: parsedData.time,
        timezone: parsedData.timezone || 'IST',
      };

      parsedDocument.rawResponse = parsedData;
      parsedDocument.parsingSuccessful = true;
      parsedDocument.parsedAt = new Date();

      this.logger.log(`✅ Document parsing SUCCESSFUL`);
      this.logger.log(`   Signature Status: ${parsedDocument.signatureDetails.signatureStatus}`);
      this.logger.log(`   Signed By: ${parsedDocument.signatureDetails.signedBy || '(empty)'}`);
      this.logger.log(`   Organization: ${parsedDocument.signatureDetails.organization || '(empty)'}`);
    } catch (error) {
      this.logger.error(`\n❌ PARSING FAILED: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      parsedDocument.parsingSuccessful = false;
      parsedDocument.parsingError = error.message;
      parsedDocument.parsedAt = new Date();
    }

    // Save the parsed document
    this.logger.log(`\n💾 Saving document to database...`);
    const savedDoc = await parsedDocument.save();
    const savedId = (savedDoc._id as any).toString();
    this.logger.log(`✅ Document saved with ID: ${savedId}`);

    // Update organization with the parsed document reference
    this.logger.log(`\n🔗 Linking document to organization...`);
    await this.updateOrganizationWithDocument(organizationId, savedId);

    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`✅ DOCUMENT PARSING COMPLETE`);
    this.logger.log(`   Document ID: ${savedId}`);
    this.logger.log(`   Success: ${savedDoc.parsingSuccessful}`);
    this.logger.log(`${'='.repeat(60)}\n`);

    return savedDoc;
  }

  /**
   * Parse a document from buffer (for file uploads)
   */
  async parseDocumentFromBuffer(
    organizationId: string,
    fileBuffer: Buffer,
    mimeType: string,
    documentUrl: string,
    documentType: DocumentType = DocumentType.OTHER,
    originalFileName?: string,
  ): Promise<ParsedDocument> {
    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`📋 DOCUMENT PARSING REQUEST (FROM BUFFER)`);
    this.logger.log(`${'='.repeat(60)}`);
    this.logger.log(`🏢 Organization ID: ${organizationId}`);
    this.logger.log(`📄 Document URL: ${documentUrl}`);
    this.logger.log(`📁 Document Type: ${documentType}`);
    this.logger.log(`📝 Original Filename: ${originalFileName || '(not provided)'}`);
    this.logger.log(`📦 Buffer Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    this.logger.log(`📋 MIME Type: ${mimeType}`);

    // Verify organization exists
    this.logger.log(`\n🔍 Verifying organization exists...`);
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization) {
      this.logger.error(`❌ Organization not found: ${organizationId}`);
      throw new NotFoundException('Organization not found');
    }
    this.logger.log(`✅ Organization found: ${organization.name}`);

    // Create initial parsed document record
    this.logger.log(`\n📝 Creating parsed document record...`);
    const parsedDocument = new this.parsedDocumentModel({
      organization: new Types.ObjectId(organizationId),
      documentType: documentType,
      documentUrl: documentUrl,
      originalFileName: originalFileName || '',
      parsingSuccessful: false,
    });
    this.logger.log(`✅ Document record created with temp ID`);

    try {
      // Call Gemini to parse the document from buffer
      this.logger.log(`\n🤖 Calling Gemini AI to parse document from buffer...`);
      const parsedData = await this.geminiService.parseDocumentFromBuffer(
        fileBuffer,
        mimeType,
        originalFileName,
      );

      // Map the parsed data to our schema
      this.logger.log(`\n📊 Mapping parsed data to schema...`);
      parsedDocument.signatureDetails = {
        signatureStatus: this.mapSignatureStatus(parsedData.signature_status),
        signedBy: parsedData.signed_by,
        organization: parsedData.organization,
        date: parsedData.date ? new Date(parsedData.date) : undefined,
        time: parsedData.time,
        timezone: parsedData.timezone || 'IST',
      };

      parsedDocument.rawResponse = parsedData;
      parsedDocument.parsingSuccessful = true;
      parsedDocument.parsedAt = new Date();

      this.logger.log(`✅ Document parsing SUCCESSFUL`);
      this.logger.log(`   Signature Status: ${parsedDocument.signatureDetails.signatureStatus}`);
      this.logger.log(`   Signed By: ${parsedDocument.signatureDetails.signedBy || '(empty)'}`);
      this.logger.log(`   Organization: ${parsedDocument.signatureDetails.organization || '(empty)'}`);
    } catch (error) {
      this.logger.error(`\n❌ PARSING FAILED: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      parsedDocument.parsingSuccessful = false;
      parsedDocument.parsingError = error.message;
      parsedDocument.parsedAt = new Date();
    }

    // Save the parsed document
    this.logger.log(`\n💾 Saving document to database...`);
    const savedDoc = await parsedDocument.save();
    const savedId = (savedDoc._id as any).toString();
    this.logger.log(`✅ Document saved with ID: ${savedId}`);

    // Update organization with the parsed document reference
    this.logger.log(`\n🔗 Linking document to organization...`);
    await this.updateOrganizationWithDocument(organizationId, savedId);

    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`✅ DOCUMENT PARSING COMPLETE`);
    this.logger.log(`   Document ID: ${savedId}`);
    this.logger.log(`   Success: ${savedDoc.parsingSuccessful}`);
    this.logger.log(`${'='.repeat(60)}\n`);

    return savedDoc;
  }

  /**
   * Update organization with parsed document reference
   */
  private async updateOrganizationWithDocument(
    organizationId: string,
    documentId: string,
  ): Promise<void> {
    await this.organizationModel.findByIdAndUpdate(
      organizationId,
      {
        $push: {
          parsedDocuments: new Types.ObjectId(documentId),
        },
      },
    );

    this.logger.log(
      `[updateOrganizationWithDocument] Added document ${documentId} to organization ${organizationId}`,
    );
  }

  /**
   * Map signature status string to enum
   */
  private mapSignatureStatus(status: string): SignatureStatus {
    const normalizedStatus = status?.toLowerCase()?.trim();
    if (normalizedStatus?.includes('verified') && !normalizedStatus?.includes('not')) {
      return SignatureStatus.VERIFIED;
    } else if (normalizedStatus?.includes('not verified') || normalizedStatus?.includes('unverified')) {
      return SignatureStatus.NOT_VERIFIED;
    }
    return SignatureStatus.UNKNOWN;
  }

  /**
   * Get parsed document by ID
   */
  async getById(documentId: string): Promise<ParsedDocument> {
    const document = await this.parsedDocumentModel.findById(documentId);
    if (!document) {
      throw new NotFoundException('Parsed document not found');
    }
    return document;
  }

  /**
   * Get all parsed documents for an organization
   */
  async getByOrganization(organizationId: string): Promise<ParsedDocument[]> {
    return this.parsedDocumentModel
      .find({
        organization: new Types.ObjectId(organizationId),
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Delete a parsed document
   */
  async delete(documentId: string, organizationId: string): Promise<void> {
    const document = await this.parsedDocumentModel.findOne({
      _id: documentId,
      organization: new Types.ObjectId(organizationId),
    });

    if (!document) {
      throw new NotFoundException('Parsed document not found');
    }

    // Soft delete
    document.isActive = false;
    await document.save();

    // Remove from organization
    await this.organizationModel.findByIdAndUpdate(organizationId, {
      $pull: { parsedDocuments: new Types.ObjectId(documentId) },
    });

    this.logger.log(`[delete] Soft deleted document: ${documentId}`);
  }
}
