import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationsService } from '../organizations/organizations.service';
import { JobRolesService } from '../job-roles/job-roles.service';
import { UploadService } from '../upload/upload.service';
import { DocumentParserService } from '../document-parser/document-parser.service';
import { DocumentType } from '../document-parser/schemas/parsed-document.schema';
import { OnboardingStep1Dto } from './dto/step-1.dto';
import { OnboardingStep2Dto, OfficeTypeEnum } from './dto/step-2.dto';
import { OnboardingStep3Dto } from './dto/step-3.dto';
import { OnboardingStep4Dto } from './dto/step-4.dto';
import { OfficeType } from '../organizations/schemas/organization.schema';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly jobRolesService: JobRolesService,
    private readonly uploadService: UploadService,
    private readonly documentParserService: DocumentParserService,
  ) {}

  /**
   * Get onboarding status
   */
  async getStatus(organizationId: Types.ObjectId) {
    const organization = await this.organizationsService.findById(organizationId);

    return {
      currentStep: organization.onboardingStep,
      isCompleted: organization.onboardingCompleted,
      organization: {
        name: organization.name,
        industry: organization.industry,
        branchCount: organization.branches.length,
      },
    };
  }

  /**
   * Process Step 1: Company Details
   */
  async processStep1(
    organizationId: Types.ObjectId,
    step1Dto: OnboardingStep1Dto,
    registrationDocument?: Express.Multer.File,
    companyProfileDocument?: Express.Multer.File,
  ) {
    const organization = await this.organizationsService.findById(organizationId);

    // Upload documents if provided
    let registrationDocumentUrl: string | undefined;
    let companyProfileDocumentUrl: string | undefined;

    if (registrationDocument) {
      const result = await this.uploadService.uploadFile(
        registrationDocument,
        `planetshr/organizations/${organizationId}/documents`,
      );
      registrationDocumentUrl = result.url;
    }

    if (companyProfileDocument) {
      const result = await this.uploadService.uploadFile(
        companyProfileDocument,
        `planetshr/organizations/${organizationId}/documents`,
      );
      companyProfileDocumentUrl = result.url;
    }

    // Update organization
    await this.organizationsService.update(organizationId, {
      name: step1Dto.company_name,
      businessCategory: step1Dto.business_category,
      industry: step1Dto.industry,
      subIndustry: step1Dto.sub_industry,
      companyTurnover: step1Dto.company_turnover,
      employeeSize: step1Dto.employee_size,
      companyCulture: step1Dto.company_culture,
      companyType: step1Dto.company_type,
      registrationDocumentUrl,
      companyProfileDocumentUrl,
      onboardingStep: 1,
    } as any);

    // Parse the registration document if uploaded (GST Certificate parsing)
    let parsedDocumentResult: any = null;
    if (registrationDocument && registrationDocumentUrl) {
      this.logger.log(`📄 Starting document parsing for organization: ${organizationId}`);
      this.logger.log(`📄 Document URL: ${registrationDocumentUrl}`);
      this.logger.log(`📄 File: ${registrationDocument.originalname}, Size: ${(registrationDocument.size / 1024).toFixed(2)} KB`);

      try {
        // Use buffer-based parsing to avoid download auth issues
        const parsedDoc = await this.documentParserService.parseDocumentFromBuffer(
          organizationId.toString(),
          registrationDocument.buffer,
          registrationDocument.mimetype,
          registrationDocumentUrl,
          DocumentType.GST_CERTIFICATE,
          registrationDocument.originalname,
        );
        this.logger.log(`✅ Document parsed successfully. ID: ${(parsedDoc._id as any).toString()}`);
        parsedDocumentResult = {
          id: (parsedDoc._id as any).toString(),
          signatureDetails: parsedDoc.signatureDetails,
          parsingSuccessful: parsedDoc.parsingSuccessful,
        };
      } catch (error) {
        this.logger.error(`❌ Document parsing failed: ${error.message}`);
        // Don't fail the onboarding if parsing fails - just log the error
      }
    }

    return {
      message: 'Step 1 completed successfully',
      nextStep: 2,
      parsedDocument: parsedDocumentResult,
    };
  }

  /**
   * Process Step 2: Office/Branch Details (Array of locations)
   */
  async processStep2(
    organizationId: Types.ObjectId,
    step2Dto: OnboardingStep2Dto,
  ) {
    const organization = await this.organizationsService.findById(organizationId);

    // Validate step progression
    if (organization.onboardingStep < 1) {
      throw new BadRequestException('Please complete step 1 first');
    }

    // Map DTO office type to schema office type
    const officeTypeMap: Record<OfficeTypeEnum, OfficeType> = {
      [OfficeTypeEnum.HEADQUARTER]: OfficeType.HEADQUARTER,
      [OfficeTypeEnum.BRANCH_OFFICE]: OfficeType.BRANCH_OFFICE,
      [OfficeTypeEnum.REGIONAL_OFFICE]: OfficeType.REGIONAL_OFFICE,
      [OfficeTypeEnum.SATELLITE_OFFICE]: OfficeType.SATELLITE_OFFICE,
    };

    // Create all branches and collect their IDs
    const branchIds: Record<string, string> = {};

    for (const location of step2Dto.locations) {
      await this.organizationsService.addBranch(organizationId, {
        name: location.office_name,
        officeType: officeTypeMap[location.office_type],
        country: location.country,
        state: location.state,
        city: location.city,
        address: location.address,
      } as any);

      // Get the created branch ID
      const updatedOrg = await this.organizationsService.findById(organizationId);
      const createdBranch = updatedOrg.branches[updatedOrg.branches.length - 1];
      branchIds[location.office_name] = createdBranch._id.toString();
    }

    // Update onboarding step
    await this.organizationsService.update(organizationId, {
      onboardingStep: 2,
    } as any);

    return {
      message: 'Step 2 completed successfully',
      nextStep: 3,
      branchIds, // Return map of office_name -> branchId
      totalBranches: step2Dto.locations.length,
    };
  }

  /**
   * Process Step 3: Department Details (Array of departments)
   */
  async processStep3(
    organizationId: Types.ObjectId,
    step3Dto: OnboardingStep3Dto,
  ) {
    const organization = await this.organizationsService.findById(organizationId);

    // Validate step progression
    if (organization.onboardingStep < 2) {
      throw new BadRequestException('Please complete step 2 first');
    }

    // Create a map of branch names to IDs for lookup
    const branchNameToId: Record<string, Types.ObjectId> = {};
    for (const branch of organization.branches) {
      branchNameToId[branch.name] = branch._id;
    }

    // Validate all branch names exist
    for (const dept of step3Dto.departments) {
      if (!branchNameToId[dept.office_name]) {
        throw new NotFoundException(`Branch "${dept.office_name}" not found. Available branches: ${Object.keys(branchNameToId).join(', ')}`);
      }
    }

    // Create all departments and collect their IDs
    const departmentIds: Record<string, string> = {};

    for (const dept of step3Dto.departments) {
      const branchId = branchNameToId[dept.office_name];

      await this.organizationsService.addDepartment(
        organizationId,
        branchId,
        {
          name: dept.department_name,
          culture: dept.department_culture,
          goals: dept.department_goals,
        } as any,
      );

      // Get the created department ID
      const updatedOrg = await this.organizationsService.findById(organizationId);
      const updatedBranch = updatedOrg.branches.find(
        b => b._id.toString() === branchId.toString(),
      );
      const createdDepartment = updatedBranch?.departments[updatedBranch.departments.length - 1];
      if (createdDepartment) {
        departmentIds[dept.department_name] = createdDepartment._id.toString();
      }
    }

    // Update onboarding step
    await this.organizationsService.update(organizationId, {
      onboardingStep: 3,
    } as any);

    return {
      message: 'Step 3 completed successfully',
      nextStep: 4,
      departmentIds, // Return map of department_name -> departmentId
      totalDepartments: step3Dto.departments.length,
    };
  }

  /**
   * Process Step 4: Job Role Details (Array of job roles)
   */
  async processStep4(
    organizationId: Types.ObjectId,
    step4Dto: OnboardingStep4Dto,
  ) {
    const organization = await this.organizationsService.findById(organizationId);

    // Validate step progression
    if (organization.onboardingStep < 3) {
      throw new BadRequestException('Please complete step 3 first');
    }

    // Create maps for branch and department name to ID lookup
    const branchNameToId: Record<string, string> = {};
    const departmentNameToId: Record<string, Record<string, string>> = {};

    for (const branch of organization.branches) {
      branchNameToId[branch.name] = branch._id.toString();
      departmentNameToId[branch.name] = {};

      for (const dept of branch.departments) {
        departmentNameToId[branch.name][dept.name] = dept._id.toString();
      }
    }

    // Validate all branch and department names exist
    for (const role of step4Dto.job_roles) {
      if (!branchNameToId[role.office_name]) {
        throw new NotFoundException(
          `Branch "${role.office_name}" not found. Available branches: ${Object.keys(branchNameToId).join(', ')}`,
        );
      }
      if (!departmentNameToId[role.office_name]?.[role.department_name]) {
        throw new NotFoundException(
          `Department "${role.department_name}" not found in branch "${role.office_name}". Available departments: ${Object.keys(departmentNameToId[role.office_name] || {}).join(', ')}`,
        );
      }
    }

    // Create all job roles and collect their IDs
    const jobRoleIds: Record<string, string> = {};

    for (const role of step4Dto.job_roles) {
      const branchId = branchNameToId[role.office_name];
      const departmentId = departmentNameToId[role.office_name][role.department_name];

      const jobRole = await this.jobRolesService.create(
        {
          branchId,
          departmentId,
          jobRole: role.job_role,
          jobTitle: role.job_title,
          reportingTo: role.reporting_to,
          criticalAttribute: role.critical_attribute,
          description: role.description,
        },
        organizationId,
      );

      jobRoleIds[role.job_title] = (jobRole._id as any).toString();
    }

    // Mark onboarding as completed
    await this.organizationsService.update(organizationId, {
      onboardingStep: 4,
      onboardingCompleted: true,
    } as any);

    return {
      message: 'Onboarding completed successfully',
      isCompleted: true,
      jobRoleIds, // Return map of job_title -> jobRoleId
      totalJobRoles: step4Dto.job_roles.length,
    };
  }
}
