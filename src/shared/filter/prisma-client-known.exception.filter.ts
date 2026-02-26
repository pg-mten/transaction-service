import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientKnownExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    console.log('PrismaClientKnownExceptionFilter');

    const { code, meta, message } = exception;

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage: string = message.replace(/\n/g, '');
    const error: Record<string, unknown> = meta ?? {};
    error[code] = errorMessage;

    switch (code) {
      /**
       * Common
       * https://www.prisma.io/docs/orm/reference/error-reference#common
       */
      case 'P1000':
        statusCode = HttpStatus.UNAUTHORIZED;
        errorMessage = 'Authentication failed against the database server.';
        break;
      case 'P1001':
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorMessage = 'Database server could not be reached.';
        break;
      case 'P1002':
        statusCode = HttpStatus.REQUEST_TIMEOUT;
        errorMessage = 'Database connection timed out.';
        break;
      case 'P1003':
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Database does not exist.';
        break;
      case 'P1008':
        statusCode = HttpStatus.REQUEST_TIMEOUT;
        errorMessage = 'Operation timed out.';
        break;
      case 'P1009':
        statusCode = HttpStatus.FORBIDDEN;
        errorMessage = 'Database already exists.';
        break;
      case 'P1010':
        statusCode = HttpStatus.UNAUTHORIZED;
        errorMessage = 'User access denied due to insufficient privileges.';
        break;
      case 'P1011':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Error occurred during database initialization.';
        break;
      case 'P1012':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Schema validation error.';
        break;

      /**
       * Prisma Client (Query Engine)
       * https://www.prisma.io/docs/orm/reference/error-reference#common
       */

      case 'P2000':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Input value is too long.';
        break;
      case 'P2001':
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Record not found.';
        break;
      case 'P2002':
        statusCode = HttpStatus.CONFLICT;
        errorMessage = 'Unique constraint violation.';
        break;
      case 'P2003':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Foreign key constraint violation.';
        break;
      case 'P2004':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Constraint violation.';
        break;
      case 'P2005':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Invalid value for field.';
        break;
      case 'P2006':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Invalid type for field.';
        break;
      case 'P2007':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Data validation error.';
        break;
      case 'P2008':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Failed to parse query.';
        break;
      case 'P2009':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Invalid input for query.';
        break;
      case 'P2010':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Raw query failed.';
        break;
      case 'P2011':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Null constraint violation.';
        break;
      case 'P2012':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Missing required value.';
        break;
      case 'P2013':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Missing required argument.';
        break;
      case 'P2014':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Relation violation.';
        break;
      case 'P2015':
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Related record not found.';
        break;
      case 'P2016':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Query interpretation error.';
        break;
      case 'P2017':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Records required but not found.';
        break;
      case 'P2018':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Invalid record reference.';
        break;
      case 'P2019':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Input error.';
        break;
      case 'P2020':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Value out of range.';
        break;
      case 'P2021':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Table or view not found.';
        break;
      case 'P2022':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Column not found.';
        break;
      case 'P2023':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Inconsistent database schema.';
        break;
      case 'P2024':
        statusCode = HttpStatus.REQUEST_TIMEOUT;
        errorMessage = 'Transaction timeout.';
        break;
      case 'P2025':
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Record to update not found.';
        break;
      case 'P2026':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Unsupported feature.';
        break;
      case 'P2027':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Query parameter mismatch.';
        break;
      case 'P2030':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Connection pool error.';
        break;
      case 'P2031':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Connection error.';
        break;
      case 'P2033':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Data retrieval error.';
        break;
      case 'P2034':
        statusCode = HttpStatus.CONFLICT;
        errorMessage =
          'Transaction failed due to a write conflict or a deadlock. Please retry your transaction.';
        break;
      case 'P2035':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Assertion violation on the database.';
        break;
      case 'P2036':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Error in external connector.';
        break;
      case 'P2037':
        statusCode = HttpStatus.TOO_MANY_REQUESTS;
        errorMessage = 'Too many database connections opened.';
        break;

      /**
       * Prisma Migrate (Schema Engine)
       * https://www.prisma.io/docs/orm/reference/error-reference#prisma-migrate-schema-engine
       */

      case 'P3000':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Failed to create database.';
        break;
      case 'P3001':
        statusCode = HttpStatus.NOT_FOUND;
        errorMessage = 'Migration file not found.';
        break;
      case 'P3002':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Migration already applied.';
        break;
      case 'P3003':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Migration already rolled back.';
        break;
      case 'P3004':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Database is dirty and needs to be reset.';
        break;
      case 'P3005':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Cannot find a migration to rollback.';
        break;
      case 'P3006':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Database version mismatch. Migration failed.';
        break;
      case 'P3007':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Migration failed to apply cleanly.';
        break;
      case 'P3008':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'The migration name is invalid.';
        break;
      case 'P3009':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Migrations directory is not found.';
        break;
      case 'P3010':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Failed to delete the migration.';
        break;
      case 'P3011':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Migration history is corrupted or out-of-sync.';
        break;
      case 'P3012':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'A migration failed to apply.';
        break;
      case 'P3013':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'The migration is already in progress.';
        break;
      case 'P3014':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Cannot access the database.';
        break;
      case 'P3015':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Migration validation failed.';
        break;
      case 'P3016':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Invalid migration format.';
        break;
      case 'P3017':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Migration not initialized.';
        break;
      case 'P3018':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Failed to execute the migration script.';
        break;
      case 'P3019':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Failed to resolve migration name conflict.';
        break;
      case 'P3020':
        statusCode = HttpStatus.BAD_REQUEST;
        errorMessage = 'Database schema mismatch with Prisma schema.';
        break;
      case 'P3021':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Migration log is corrupted.';
        break;
      case 'P3022':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Migration failed due to database error.';
        break;

      /**
       * prisma db pull
       * https://www.prisma.io/docs/orm/reference/error-reference#prisma-db-pull
       */

      case 'P4000':
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorMessage = 'Database connection error: Database does not exist.';
        break;
      case 'P4001':
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorMessage = 'No database connection. Database is empty.';
        break;
      case 'P4002':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage =
          'Database cannot be accessed. Ensure the connection is valid.';
        break;
      case 'P4003':
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = 'Operation timed out while connecting to the database.';
        break;

      /**
       * Prisma Accelerate
       * https://www.prisma.io/docs/orm/reference/error-reference#prisma-accelerate
       */

      case 'P6000':
        errorMessage = 'An unexpected internal error occurred in Prisma.';
        break;
      case 'P6001':
        errorMessage =
          'Internal connection error while accessing the database.';
        break;
      case 'P6002':
        errorMessage = 'Query engine process terminated unexpectedly.';
        break;
      case 'P6003':
        errorMessage = 'Schema mismatch: Prisma schema is inconsistent.';
        break;
      case 'P6004':
        errorMessage = 'Failed to initialize Prisma query engine.';
        break;
      case 'P6005':
        errorMessage = 'Serialization or deserialization error in Prisma.';
        break;
      case 'P6006':
        errorMessage = 'Failed to process the request to the database.';
        break;
      case 'P6007':
        errorMessage = 'Internal memory corruption in Prisma query engine.';
        break;
      case 'P6008':
        errorMessage = 'Schema validation failed during query execution.';
        break;
      case 'P6009':
        errorMessage = 'Unknown request error in Prisma query engine.';
        break;
      case 'P6010':
        errorMessage = 'Unexpected response received from Prisma query engine.';
        break;

      case 'P5011':
        statusCode = HttpStatus.SERVICE_UNAVAILABLE; // 503 - Database connection issue
        errorMessage =
          'Database connection error. Please check your connection settings or ensure the database is running.';
        break;
      default:
        errorMessage = 'An unknown error occurred.';
        break;
    }

    response.status(statusCode).json(
      new ResponseDto<null>({
        message: errorMessage,
        status: ResponseStatus.ERROR,
        statusCode,
        error,
      }),
    );
  }
}
