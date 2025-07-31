import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ResponseException } from 'src/exception/response.exception';
import { Response } from 'express';

@Catch(ResponseException)
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: ResponseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const responseDto = exception.getResponseDto();

    return response.status(responseDto.statusCode).json(responseDto);
  }
}
