import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { InvalidRequestException } from 'src/shared/exception';

@Catch(InvalidRequestException)
export class InvalidRequestExceptionFilter implements ExceptionFilter {
  catch(exception: InvalidRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const responseDto = exception.getResponseDto();
    responseDto.meta = {
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      ...(typeof responseDto.meta === 'object' && responseDto.meta !== null
        ? responseDto.meta
        : {}),
    };

    return response.status(responseDto.statusCode).json(responseDto);
  }
}
