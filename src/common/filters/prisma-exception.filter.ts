import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Handle specific Prisma error codes
    switch (exception.code) {
      case 'P2002': // Unique constraint failed
        status = HttpStatus.CONFLICT;
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        break;
      default:
        // default 500
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      code: exception.code,
    });
  }
}
