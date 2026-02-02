import { HttpException } from '@nestjs/common';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';

export class ResponseException extends Error {
  private readonly responseDto: ResponseDto<unknown>;

  constructor(responseDto: ResponseDto<unknown>) {
    super();
    this.responseDto = responseDto;
  }

  getResponseDto(): ResponseDto<unknown> {
    return this.responseDto;
  }

  static fromHttpExecption(
    exception: HttpException,
    error?: Record<string, unknown> | null,
  ) {
    const responseDto = new ResponseDto({
      statusCode: exception.getStatus(),
      status: ResponseStatus.ERROR,
      message: exception.message,
      error: error,
    });
    return new ResponseException(responseDto);
  }
}
