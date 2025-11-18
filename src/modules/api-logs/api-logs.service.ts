import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AstrologyApiLog } from './schemas/astrology-api-log.schema';

export interface CreateAstrologyLogDto {
  employeeId: string;
  organization: string;
  endpoint: string;
  requestData: {
    day: number;
    month: number;
    year: number;
    hour: number;
    min: number;
    lat: number;
    lon: number;
    tzone: number;
  };
  birthInfo: {
    city: string;
    country: string;
    birthDate: Date;
    birthTime: string;
  };
  status: 'success' | 'failed';
  httpStatus?: number;
  responseTime: number;
  planetsExtracted?: number;
  housesExtracted?: number;
  errorDetails?: {
    message: string;
    code: string;
    apiResponse?: any;
  };
  planetNames?: string[];
  apiMetadata?: {
    apiVersion: string;
    subscriptionPlan: string;
    creditsUsed: number;
  };
}

@Injectable()
export class ApiLogsService {
  constructor(
    @InjectModel(AstrologyApiLog.name)
    private astrologyApiLogModel: Model<AstrologyApiLog>,
  ) {}

  async logAstrologyApiCall(
    data: CreateAstrologyLogDto,
  ): Promise<AstrologyApiLog> {
    const log = new this.astrologyApiLogModel({
      ...data,
      requestedAt: new Date(),
      completedAt: new Date(),
    });

    return await log.save();
  }

  async getLogsByEmployee(
    employeeId: string,
    limit: number = 10,
  ): Promise<AstrologyApiLog[]> {
    return await this.astrologyApiLogModel
      .find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getLogsByOrganization(
    organization: string,
    limit: number = 50,
  ): Promise<AstrologyApiLog[]> {
    return await this.astrologyApiLogModel
      .find({ organization })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getFailedLogs(limit: number = 20): Promise<AstrologyApiLog[]> {
    return await this.astrologyApiLogModel
      .find({ status: 'failed' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getApiStats(organization?: string) {
    const matchStage = organization ? { organization } : {};

    const stats = await this.astrologyApiLogModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          totalPlanetsExtracted: { $sum: '$planetsExtracted' },
        },
      },
    ]);

    const totalCalls = await this.astrologyApiLogModel.countDocuments(
      matchStage,
    );

    return {
      totalCalls,
      stats,
    };
  }

  async getRecentActivity(hours: number = 24): Promise<AstrologyApiLog[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await this.astrologyApiLogModel
      .find({ requestedAt: { $gte: since } })
      .sort({ requestedAt: -1 })
      .limit(100)
      .exec();
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.astrologyApiLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }
}
