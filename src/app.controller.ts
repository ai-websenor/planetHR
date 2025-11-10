import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Application health check' })
  getHello(): string {
    this.logger.log('[GET /] - Health check endpoint called');
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    this.logger.log('[GET /health] - Health check endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'PlanetsHR Backend API',
      version: '1.0.0',
    };
  }
}
