import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import axios from 'axios';
import { Request, Response } from 'express';
import { InvalidRequestException, ResponseException } from 'src/shared/exception';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const responseDto = this.toResponseDto(exception, request);

    response.status(responseDto.statusCode).json(responseDto);
  }

  private toResponseDto(
    exception: unknown,
    request: Request,
  ): ResponseDto<null> {
    if (
      exception instanceof ResponseException ||
      exception instanceof InvalidRequestException
    ) {
      const responseDto = exception.getResponseDto() as ResponseDto<null>;
      responseDto.meta = this.buildMeta(request, responseDto.meta);
      return responseDto;
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, request);
    }

    if (axios.isAxiosError(exception)) {
      return this.fromAxiosError(exception, request);
    }

    if (exception instanceof Error) {
      return this.fromGenericError(exception, request);
    }

    return new ResponseDto<null>({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      status: ResponseStatus.ERROR,
      message: 'An unexpected internal error occurred',
      error: { code: 'INTERNAL_ERROR' },
      meta: this.buildMeta(request),
    });
  }

  private fromHttpException(
    exception: HttpException,
    request: Request,
  ): ResponseDto<null> {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const message =
      typeof response === 'string'
        ? response
        : typeof response === 'object' &&
            response !== null &&
            'message' in response
          ? Array.isArray(response.message)
            ? String(response.message[0] ?? exception.message)
            : String(response.message ?? exception.message)
          : exception.message;

    const baseError =
      typeof response === 'object' &&
      response !== null &&
      'error' in response &&
      typeof response.error === 'object' &&
      response.error !== null
        ? { ...(response.error as Record<string, unknown>) }
        : {};

    if (!baseError.code) {
      baseError.code = this.httpErrorCode(statusCode, message);
    }

    return new ResponseDto<null>({
      statusCode,
      status: ResponseStatus.ERROR,
      message,
      error: baseError,
      meta: this.buildMeta(request),
    });
  }

  private fromAxiosError(error: any, request: Request): ResponseDto<null> {
    const isTimeout = error.code === 'ECONNABORTED';
    const upstreamStatus =
      typeof error.response?.status === 'number' ? error.response.status : null;
    const statusCode =
      isTimeout || upstreamStatus === null
        ? HttpStatus.SERVICE_UNAVAILABLE
        : upstreamStatus >= 500
          ? HttpStatus.SERVICE_UNAVAILABLE
          : HttpStatus.BAD_GATEWAY;
    const code = isTimeout
      ? 'DEPENDENCY_TIMEOUT'
      : upstreamStatus === null || upstreamStatus >= 500
        ? 'DEPENDENCY_UNAVAILABLE'
        : 'DEPENDENCY_INVALID_RESPONSE';

    return new ResponseDto<null>({
      statusCode,
      status: ResponseStatus.ERROR,
      message: 'Dependent service request failed',
      error: {
        code,
        details: {
          upstreamStatus,
          method: error.config?.method ?? null,
          url: error.config?.url ?? null,
        },
      },
      meta: this.buildMeta(request),
    });
  }

  private fromGenericError(error: Error, request: Request): ResponseDto<null> {
    const invalidDecimal = error.message.startsWith('Invalid decimal value');
    const invalidDate = error.message.startsWith('Invalid date value');

    if (invalidDecimal || invalidDate) {
      return new ResponseDto<null>({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        status: ResponseStatus.ERROR,
        message: invalidDecimal
          ? 'Request contains an invalid decimal value'
          : 'Request contains an invalid date-time value',
        error: {
          code: invalidDecimal ? 'INVALID_DECIMAL' : 'INVALID_DATE',
        },
        meta: this.buildMeta(request),
      });
    }

    return new ResponseDto<null>({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      status: ResponseStatus.ERROR,
      message: 'An unexpected internal error occurred',
      error: { code: 'INTERNAL_ERROR' },
      meta: this.buildMeta(request),
    });
  }

  private httpErrorCode(statusCode: number, message: string): string {
    if (
      statusCode === HttpStatus.BAD_REQUEST &&
      message.includes('numeric string is expected')
    ) {
      return 'INVALID_PATH_PARAMETER';
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_FAILED';
      default:
        return 'HTTP_EXCEPTION';
    }
  }

  private buildMeta(
    request: Request,
    existingMeta?: unknown,
  ): Record<string, unknown> {
    return {
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      ...(typeof existingMeta === 'object' && existingMeta !== null
        ? existingMeta
        : {}),
    };
  }
}
