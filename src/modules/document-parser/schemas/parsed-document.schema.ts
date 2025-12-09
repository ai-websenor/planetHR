import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DocumentType {
  GST_CERTIFICATE = 'gst_certificate',
  REGISTRATION = 'registration',
  OTHER = 'other',
}

export enum SignatureStatus {
  VERIFIED = 'Verified',
  NOT_VERIFIED = 'Not Verified',
  UNKNOWN = 'Unknown',
}

@Schema({ _id: false })
export class SignatureDetails {
  @Prop({ enum: SignatureStatus, default: SignatureStatus.UNKNOWN })
  signatureStatus: SignatureStatus;

  @Prop({ trim: true })
  signedBy: string;

  @Prop({ trim: true })
  organization: string;

  @Prop({ type: Date })
  date?: Date;

  @Prop({ trim: true })
  time: string;

  @Prop({ trim: true, default: 'IST' })
  timezone: string;
}

export const SignatureDetailsSchema = SchemaFactory.createForClass(SignatureDetails);

@Schema({
  timestamps: true,
  collection: 'parsed_documents',
})
export class ParsedDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization: Types.ObjectId;

  @Prop({ enum: DocumentType, default: DocumentType.OTHER })
  documentType: DocumentType;

  @Prop({ required: true, trim: true })
  documentUrl: string;

  @Prop({ trim: true })
  originalFileName: string;

  @Prop({ type: SignatureDetailsSchema })
  signatureDetails: SignatureDetails;

  @Prop({ type: Object })
  rawResponse: Record<string, any>;

  @Prop({ default: false })
  parsingSuccessful: boolean;

  @Prop({ trim: true })
  parsingError: string;

  @Prop({ type: Date })
  parsedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ParsedDocumentSchema = SchemaFactory.createForClass(ParsedDocument);

// Indexes
ParsedDocumentSchema.index({ organization: 1 });
ParsedDocumentSchema.index({ documentType: 1 });
ParsedDocumentSchema.index({ parsingSuccessful: 1 });
ParsedDocumentSchema.index({ createdAt: -1 });

// Enable virtuals in JSON
ParsedDocumentSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

ParsedDocumentSchema.set('toObject', { virtuals: true });
