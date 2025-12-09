import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobRolesController } from './job-roles.controller';
import { JobRolesService } from './job-roles.service';
import { JobRole, JobRoleSchema } from './schemas/job-role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobRole.name, schema: JobRoleSchema },
    ]),
  ],
  controllers: [JobRolesController],
  providers: [JobRolesService],
  exports: [JobRolesService],
})
export class JobRolesModule {}
