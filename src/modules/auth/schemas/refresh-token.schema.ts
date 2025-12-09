import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'refresh_tokens',
})
export class RefreshToken extends Document {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop({ type: Date })
  revokedAt: Date;

  @Prop()
  replacedByToken: string;

  // Virtual to check if token is expired
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Virtual to check if token is active
  get isActive(): boolean {
    return !this.isRevoked && !this.isExpired;
  }
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Indexes
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual fields
RefreshTokenSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

RefreshTokenSchema.virtual('isActive').get(function () {
  return !this.isRevoked && new Date() <= this.expiresAt;
});

// Enable virtuals in JSON
RefreshTokenSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

RefreshTokenSchema.set('toObject', { virtuals: true });
