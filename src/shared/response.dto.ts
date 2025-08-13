import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from './pagination/pagination';

export enum ResponseStatus {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
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
    status: ResponseStatus;
    message?: string;
    data?: T | null;
    pagination?: PaginationDto | null;
    meta?: unknown;
    error?: Record<string, unknown> | null;
  }) {
    let statusCodeTemp = HttpStatus.OK;
    let messageTemp = '';
    switch (status) {
      case ResponseStatus.CREATED:
        statusCodeTemp = HttpStatus.CREATED;
        messageTemp = 'Created';
        break;
      case ResponseStatus.UPDATED:
        statusCodeTemp = HttpStatus.OK;
        messageTemp = 'Updated';
        break;
      case ResponseStatus.SUCCESS:
        statusCodeTemp = HttpStatus.OK;
        messageTemp = 'Request Successfully';
        break;
      case ResponseStatus.ERROR:
        statusCodeTemp = HttpStatus.BAD_REQUEST;
        messageTemp = 'Error';
        break;
      case ResponseStatus.PARTIAL_SUCCESS:
        statusCodeTemp = HttpStatus.OK;
        messageTemp = 'There is some error';
        break;
    }
    this.statusCode = statusCode ?? statusCodeTemp;
    this.status = status ?? ResponseStatus.SUCCESS;
    this.message = message ?? messageTemp;
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
