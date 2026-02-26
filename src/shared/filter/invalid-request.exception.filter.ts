import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { InvalidRequestException } from 'src/shared/exception';

@Catch(InvalidRequestException)
export class InvalidRequestExceptionFilter implements ExceptionFilter {
  catch(exception: InvalidRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const responseDto = exception.getResponseDto();

    return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(responseDto);
  }
}
