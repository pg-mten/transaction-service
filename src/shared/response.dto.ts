import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from './pagination/pagination';

export enum ResponseStatus {
  CREATED = 'CREATED',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}

export class ResponseDto<T> {
  constructor({
    statusCode,
    status,
    message,
    data,
    pagination,
    meta,
    error,
  }: {
    statusCode?: number | null;
    status?: ResponseStatus | null;
    message: string;
    data?: T | null;
    pagination?: PaginationDto | null;
    meta?: unknown;
    error?: Record<string, unknown> | null;
  }) {
    let statusCodeTemp = HttpStatus.OK;
    switch (status) {
      case ResponseStatus.CREATED:
        statusCodeTemp = HttpStatus.CREATED;
        break;
      case ResponseStatus.SUCCESS:
        statusCodeTemp = HttpStatus.OK;
        break;
      case ResponseStatus.ERROR:
        statusCodeTemp = HttpStatus.BAD_REQUEST;
        break;
      case ResponseStatus.PARTIAL_SUCCESS:
        statusCodeTemp = HttpStatus.OK;
        break;
    }
    this.statusCode = statusCode ?? statusCodeTemp;
    this.status = status ?? ResponseStatus.SUCCESS;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
    this.meta = meta;
    this.error = error;
  }

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  status: ResponseStatus;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: T | null;

  @ApiProperty({ required: false })
  pagination?: PaginationDto | null;

  @ApiProperty()
  meta: unknown;

  @ApiProperty({ required: false })
  error?: Record<string, unknown> | null;
}
