import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseHarmonics } from './schemas/base-harmonics.schema';
import { AgeHarmonics } from './schemas/age-harmonics.schema';
import { RoleInsights } from './schemas/role-insights.schema';

@Injectable()
export class HarmonicsService {
  constructor(
    @InjectModel(BaseHarmonics.name)
    private baseHarmonicsModel: Model<BaseHarmonics>,
    @InjectModel(AgeHarmonics.name)
    private ageHarmonicsModel: Model<AgeHarmonics>,
    @InjectModel(RoleInsights.name)
    private roleInsightsModel: Model<RoleInsights>,
  ) {}

  // ============================================================================
  // BASE HARMONICS METHODS
  // ============================================================================

  async saveBaseHarmonics(employeeId: string, organization: string, data: any) {
    return this.baseHarmonicsModel.findOneAndUpdate(
      { employeeId },
      {
        ...data,
        employeeId,
        organization,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  async getBaseHarmonics(employeeId: string) {
    const result = await this.baseHarmonicsModel.findOne({ employeeId });
    if (!result) {
      throw new NotFoundException(
        `Base harmonics not found for employee ${employeeId}`,
      );
    }
    return result;
  }

  async getTopHarmonicsByCluster(employeeId: string, cluster: string) {
    const result = await this.baseHarmonicsModel.findOne(
      { employeeId },
      { [`topHarmonicsByCluster.${cluster}`]: 1 },
    );

    if (!result) {
      throw new NotFoundException(
        `Base harmonics not found for employee ${employeeId}`,
      );
    }

    return result.topHarmonicsByCluster?.[cluster] || [];
  }

  async getAllTopHarmonicsByCluster(employeeId: string) {
    const result = await this.baseHarmonicsModel.findOne(
      { employeeId },
      { topHarmonicsByCluster: 1 },
    );

    if (!result) {
      throw new NotFoundException(
        `Base harmonics not found for employee ${employeeId}`,
      );
    }

    return result.topHarmonicsByCluster;
  }

  async getBaseHarmonicsStatistics(employeeId: string) {
    const result = await this.baseHarmonicsModel.findOne(
      { employeeId },
      { statistics: 1 },
    );

    if (!result) {
      throw new NotFoundException(
        `Base harmonics not found for employee ${employeeId}`,
      );
    }

    return result.statistics;
  }

  // ============================================================================
  // AGE HARMONICS METHODS
  // ============================================================================

  async saveAgeHarmonics(employeeId: string, organization: string, data: any) {
    const ageHarmonic = await this.ageHarmonicsModel.create({
      ...data,
      employeeId,
      organization,
      calculatedAt: new Date(),
    });

    // Cleanup old age harmonics (keep last 10 per employee)
    await this.cleanupOldAgeHarmonics(employeeId);

    return ageHarmonic;
  }

  async getLatestAgeHarmonics(employeeId: string) {
    const result = await this.ageHarmonicsModel
      .findOne({ employeeId })
      .sort({ calculatedForDate: -1 });

    if (!result) {
      throw new NotFoundException(
        `Age harmonics not found for employee ${employeeId}`,
      );
    }

    return result;
  }

  async getAgeHarmonicsForDate(employeeId: string, date: Date) {
    const result = await this.ageHarmonicsModel.findOne({
      employeeId,
      calculatedForDate: date,
    });

    if (!result) {
      throw new NotFoundException(
        `Age harmonics not found for employee ${employeeId} on date ${date}`,
      );
    }

    return result;
  }

  async getAllAgeHarmonics(employeeId: string) {
    return this.ageHarmonicsModel
      .find({ employeeId })
      .sort({ calculatedForDate: -1 })
      .limit(10);
  }

  // ============================================================================
  // ROLE INSIGHTS METHODS
  // ============================================================================

  async saveRoleInsights(
    employeeId: string,
    organization: string,
    role: string,
    data: any,
  ) {
    return this.roleInsightsModel.findOneAndUpdate(
      { employeeId, role },
      {
        ...data,
        employeeId,
        organization,
        role,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  async getRoleInsights(employeeId: string, role: string) {
    const result = await this.roleInsightsModel.findOne({ employeeId, role });

    if (!result) {
      throw new NotFoundException(
        `Role insights not found for employee ${employeeId} with role ${role}`,
      );
    }

    return result;
  }

  async getAllRoleInsights(employeeId: string) {
    const results = await this.roleInsightsModel.find({ employeeId });

    if (!results || results.length === 0) {
      throw new NotFoundException(
        `Role insights not found for employee ${employeeId}`,
      );
    }

    return results;
  }

  async getPromotionReadiness(employeeId: string, currentRole: string) {
    const insights = await this.roleInsightsModel.findOne(
      { employeeId, role: currentRole },
      { promotionReadiness: 1 },
    );

    if (!insights) {
      throw new NotFoundException(
        `Promotion readiness not found for employee ${employeeId} with role ${currentRole}`,
      );
    }

    return insights.promotionReadiness;
  }

  // ============================================================================
  // ORGANIZATION-WIDE QUERIES
  // ============================================================================

  async getHighPotentialEmployees(
    organization: string,
    minScore: number = 0.75,
  ) {
    return this.roleInsightsModel
      .find({
        organization,
        'promotionReadiness.score': { $gte: minScore },
      })
      .sort({ 'promotionReadiness.score': -1 })
      .populate('employeeId', 'personalInfo professionalInfo');
  }

  async getEmployeesByCluster(
    organization: string,
    cluster: string,
    minHarmonics: number = 3,
  ) {
    // Find employees with at least N harmonics in specified cluster
    return this.baseHarmonicsModel
      .find({
        organization,
        [`topHarmonicsByCluster.${cluster}`]: {
          $exists: true,
          $not: { $size: 0 },
        },
      })
      .select('employeeId topHarmonicsByCluster');
  }

  // ============================================================================
  // CLEANUP & MAINTENANCE
  // ============================================================================

  async cleanupOldAgeHarmonics(employeeId: string) {
    const all = await this.ageHarmonicsModel
      .find({ employeeId })
      .sort({ calculatedForDate: -1 });

    if (all.length > 10) {
      const toDelete = all.slice(10).map((doc) => doc._id);
      await this.ageHarmonicsModel.deleteMany({ _id: { $in: toDelete } });
    }
  }

  async deleteEmployeeHarmonics(employeeId: string) {
    await Promise.all([
      this.baseHarmonicsModel.deleteMany({ employeeId }),
      this.ageHarmonicsModel.deleteMany({ employeeId }),
      this.roleInsightsModel.deleteMany({ employeeId }),
    ]);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async hasBaseHarmonics(employeeId: string): Promise<boolean> {
    const count = await this.baseHarmonicsModel.countDocuments({ employeeId });
    return count > 0;
  }

  async hasAgeHarmonics(employeeId: string): Promise<boolean> {
    const count = await this.ageHarmonicsModel.countDocuments({ employeeId });
    return count > 0;
  }

  async getHarmonicsSummary(employeeId: string) {
    const [baseExists, ageCount, roleInsights] = await Promise.all([
      this.hasBaseHarmonics(employeeId),
      this.ageHarmonicsModel.countDocuments({ employeeId }),
      this.roleInsightsModel.countDocuments({ employeeId }),
    ]);

    return {
      employeeId,
      hasBaseHarmonics: baseExists,
      ageHarmonicsCount: ageCount,
      roleInsightsCount: roleInsights,
    };
  }
}
