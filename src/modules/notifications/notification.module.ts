import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}