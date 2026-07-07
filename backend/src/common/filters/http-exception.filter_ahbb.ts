import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter_ahbb implements ExceptionFilter {
  private readonly logger_ahbb = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error', error: 'Internal Server Error' };

    const message =
      typeof errorResponse === 'object' && (errorResponse as any).message
        ? (errorResponse as any).message
        : errorResponse;

    const error =
      typeof errorResponse === 'object' && (errorResponse as any).error
        ? (errorResponse as any).error
        : typeof exception === 'string'
          ? exception
          : exception.name || 'Error';

    // Log the error for the backend console
    if (status >= 500) {
      this.logger_ahbb.error(
        `${request.method} ${request.url} ${status} - Error: ${message}`,
        exception.stack,
      );
    } else {
      this.logger_ahbb.warn(
        `${request.method} ${request.url} ${status} - Message: ${message}`,
      );
    }

    // Clean structure for the frontend
    response.status(status).json({
      exito: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      mensaje: Array.isArray(message) ? message[0] : message, // Standardize to single string if needed, or keeping array if preferred. The user said "not polluting", so let's stick to standard.
      error: error,
    });
  }
}
