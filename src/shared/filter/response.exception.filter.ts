import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ResponseException } from 'src/shared/exception/response.exception';
import { Request, Response } from 'express';

@Catch(ResponseException)
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: ResponseException, host: ArgumentsHost) {
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
