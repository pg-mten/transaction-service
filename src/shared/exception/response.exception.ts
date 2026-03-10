import { HttpException } from '@nestjs/common';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';

type ResponseExceptionInput = {
  statusCode: number;
  message: string;
  code?: string | null;
  details?: Record<string, unknown> | null;
  fields?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
};

export class ResponseException extends Error {
  private readonly responseDto: ResponseDto<unknown>;

  constructor(responseDto: ResponseDto<unknown>) {
    super();
    this.responseDto = responseDto;
  }

  getResponseDto(): ResponseDto<unknown> {
    return this.responseDto;
  }

  static from({
    statusCode,
    message,
    code,
    details,
    fields,
    meta,
  }: ResponseExceptionInput) {
    const errorPayload: Record<string, unknown> = {};

    if (code) errorPayload.code = code;
    if (details && Object.keys(details).length > 0) {
      errorPayload.details = details;
    }
    if (fields && Object.keys(fields).length > 0) {
      errorPayload.fields = fields;
    }

    return new ResponseException(
      new ResponseDto({
        statusCode,
        status: ResponseStatus.ERROR,
        message,
        error: Object.keys(errorPayload).length > 0 ? errorPayload : null,
        meta: meta ?? undefined,
      }),
    );
  }

  static fromHttpExecption(
    exception: HttpException,
    error?: Record<string, unknown> | null,
    meta?: Record<string, unknown> | null,
  ) {
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

    const code =
      error && typeof error.code === 'string' ? (error.code as string) : null;
    const fields =
      error && typeof error.fields === 'object' && error.fields !== null
        ? (error.fields as Record<string, unknown>)
        : null;
    const details =
      error && typeof error.details === 'object' && error.details !== null
        ? (error.details as Record<string, unknown>)
        : error
          ? Object.fromEntries(
              Object.entries(error).filter(
                ([key]) => key !== 'code' && key !== 'fields',
              ),
            )
          : null;

    return ResponseException.from({
      statusCode: exception.getStatus(),
      message,
      code,
      details:
        details && Object.keys(details).length > 0 ? details : null,
      fields,
      meta,
    });
  }
}
