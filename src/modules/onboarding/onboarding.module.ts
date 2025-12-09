import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { JobRolesModule } from '../job-roles/job-roles.module';
import { UploadModule } from '../upload/upload.module';
import { DocumentParserModule } from '../document-parser/document-parser.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
    OrganizationsModule,
    JobRolesModule,
    UploadModule,
    DocumentParserModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
