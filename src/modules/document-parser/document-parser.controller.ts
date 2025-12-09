import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DocumentParserService } from './document-parser.service';
import { ParseDocumentDto } from './dto/parse-document.dto';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/services/auth.service';

@ApiTags('Document Parser')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('document-parser')
export class DocumentParserController {
  private readonly logger = new Logger(DocumentParserController.name);

  constructor(private readonly documentParserService: DocumentParserService) {}

  @Post('parse')
  @ApiOperation({
    summary: 'Parse a document to extract signature details',
    description: 'Uses Gemini AI to extract signature information from GST certificates or other documents',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document parsed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid document URL or parsing failed',
  })
  async parseDocument(
    @Body() parseDocumentDto: ParseDocumentDto,
    @User() user: JwtPayload,
  ) {
    this.logger.log(`\n🚀 [POST /document-parser/parse] Request received`);
    this.logger.log(`👤 User: ${user.email}`);
    this.logger.log(`🏢 Organization: ${user.organizationId}`);
    this.logger.log(`📄 Request Body: ${JSON.stringify(parseDocumentDto)}`);

    try {
      const result = await this.documentParserService.parseDocument(
        user.organizationId,
        parseDocumentDto,
      );

      const responseData = {
        id: (result._id as any).toString(),
        documentUrl: result.documentUrl,
        documentType: result.documentType,
        parsingSuccessful: result.parsingSuccessful,
        parsingError: result.parsingError,
        signatureDetails: result.signatureDetails,
        rawResponse: result.rawResponse,
        parsedAt: result.parsedAt,
      };

      this.logger.log(`\n✅ [POST /document-parser/parse] Response:`);
      this.logger.log(`   Document ID: ${responseData.id}`);
      this.logger.log(`   Parsing Success: ${responseData.parsingSuccessful}`);
      if (responseData.parsingError) {
        this.logger.log(`   Error: ${responseData.parsingError}`);
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: result.parsingSuccessful
          ? 'Document parsed successfully'
          : 'Document parsing completed with errors',
        data: responseData,
      };
    } catch (error) {
      this.logger.error(`\n❌ [POST /document-parser/parse] Exception: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all parsed documents for the organization',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of parsed documents',
  })
  async getAllDocuments(@User() user: JwtPayload) {
    this.logger.log(
      `[GET /document-parser] - Fetching documents for organization: ${user.organizationId}`,
    );

    const documents = await this.documentParserService.getByOrganization(
      user.organizationId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Documents retrieved successfully',
      data: documents,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific parsed document by ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parsed document details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  async getDocument(@Param('id') id: string) {
    this.logger.log(`[GET /document-parser/${id}] - Fetching document`);

    const document = await this.documentParserService.getById(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Document retrieved successfully',
      data: document,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a parsed document',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  async deleteDocument(
    @Param('id') id: string,
    @User() user: JwtPayload,
  ) {
    this.logger.log(`[DELETE /document-parser/${id}] - Deleting document`);

    await this.documentParserService.delete(id, user.organizationId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Document deleted successfully',
    };
  }
}
