import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Check if this is a validation error
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      // Return only the validation errors that actually occurred
      response.status(status).json({
        statusCode: status,
        error: 'Validation Error',
        message: exceptionResponse.message,
      });
    } else {
      // Regular BadRequestException
      response.status(status).json({
        statusCode: status,
        error: 'Bad Request',
        message: exceptionResponse.message || exceptionResponse,
      });
    }
  }
}
