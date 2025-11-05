import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EmployeesService } from './employees.service';
import { Employee } from './schemas/employee.schema';
import { Report } from '../reports/schemas/report.schema';

describe('EmployeesService', () => {
  let service: EmployeesService;

  const mockEmployeeModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exec: jest.fn(),
    save: jest.fn(),
  };

  const mockReportModel = {
    find: jest.fn(),
    sort: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getModelToken(Employee.name),
          useValue: mockEmployeeModel,
        },
        {
          provide: getModelToken(Report.name),
          useValue: mockReportModel,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByOrganization', () => {
    it('should return employees for organization', async () => {
      const mockEmployees = [
        { id: '1', personalInfo: { firstName: 'John', lastName: 'Doe' } },
        { id: '2', personalInfo: { firstName: 'Jane', lastName: 'Smith' } },
      ];

      mockEmployeeModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEmployees),
      });

      const result = await service.findByOrganization('org-123');

      expect(mockEmployeeModel.find).toHaveBeenCalledWith({
        organization: 'org-123',
        isActive: true,
      });
      expect(result).toEqual(mockEmployees);
    });
  });
});