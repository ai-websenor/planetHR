import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, ip, body, query, params } = request;
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(`→ ${method} ${originalUrl} - IP: ${ip}`);

    // Log request body (excluding sensitive fields)
    if (Object.keys(body || {}).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.log(`   Input: ${JSON.stringify(sanitizedBody)}`);
    }

    if (Object.keys(query || {}).length > 0) {
      this.logger.log(`   Query: ${JSON.stringify(query)}`);
    }

    if (Object.keys(params || {}).length > 0) {
      this.logger.log(`   Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `← ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.logger.error(
            `← ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'password',
      'confirm_password',
      'confirmPassword',
      'otp',
      'otpCode',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
