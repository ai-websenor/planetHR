import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Employee extends Document {
  @Prop({ 
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: false }
    },
    required: true 
  })
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  @Prop({ 
    type: {
      role: { type: String, required: true },
      department: { type: String, required: true },
      startDate: { type: Date, required: true },
      employeeType: { type: String, enum: ['full-time', 'part-time', 'contractor'], required: true },
      level: { type: String, required: true }
    },
    required: true 
  })
  professionalInfo: {
    role: string;
    department: string;
    startDate: Date;
    employeeType: 'full-time' | 'part-time' | 'contractor';
    level: string;
  };

  @Prop({ 
    type: {
      birthDate: { type: Date, required: true },
      birthTime: { type: String, required: false },
      birthLocation: {
        city: { type: String, required: true },
        country: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        timezone: { type: Number, required: true }
      }
    },
    required: true 
  })
  birthData: {
    birthDate: Date;
    birthTime?: string;
    birthLocation: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
      timezone: number;
    };
  };

  @Prop({ type: Object })
  energyCode: {
    astrologicalData: {
      planets: Record<string, any>;
      houses: any[];
      aspects: any[];
    };
    harmonicReferences: {
      hasBaseHarmonics: boolean;
      hasAgeHarmonics: boolean;
      lastCalculated: Date;
      nextUpdate: Date;
    };
    quickInsights: {
      topEnergyCodes: string[];
      dominantCluster: string;
      currentRole: string;
    };
    traits: string[];
    harmonicFrequency: string[];
  };

  @Prop({ type: Object })
  processingStatus: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    stage: string;
    progress: number;
    lastUpdated: Date;
    completedReports: string[];
    jobId?: string;
  };

  @Prop({ required: true })
  organization: string;

  @Prop({ 
    type: {
      userId: { type: String, required: true },
      role: { type: String, required: true },
      timestamp: { type: Date, required: true }
    },
    required: true 
  })
  addedBy: {
    userId: string;
    role: string;
    timestamp: Date;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

// Indexes for performance
EmployeeSchema.index({ organization: 1, isActive: 1 });
EmployeeSchema.index({ 'addedBy.userId': 1 });
EmployeeSchema.index({ 'processingStatus.status': 1 });
EmployeeSchema.index({ 'energyCode.harmonicReferences.nextUpdate': 1 });