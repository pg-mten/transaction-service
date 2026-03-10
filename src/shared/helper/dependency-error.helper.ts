import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import {
  ApiError,
  ApiErrorCode,
  DependencyFailureContext,
  ResponseException,
} from 'src/shared/exception';

export class DependencyErrorHelper {
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context: DependencyFailureContext,
  ): Promise<T> {
    try {
      return this.ensureData(await primary(), context);
    } catch (primaryError) {
      if (primaryError instanceof ResponseException) throw primaryError;

      try {
        return this.ensureData(await fallback(), context);
      } catch (fallbackError) {
        if (fallbackError instanceof ResponseException) throw fallbackError;
        this.throwFromError(fallbackError, context);
      }
    }
  }

  static ensureData<T>(
    value: T | null | undefined,
    context: DependencyFailureContext,
  ): T {
    if (value !== null && value !== undefined) return value;

    if (context.missingCode) {
      throw ApiError.response({
        statusCode: context.missingStatusCode ?? HttpStatus.FAILED_DEPENDENCY,
        message:
          context.missingMessage ??
          `${context.dependency} configuration is not available`,
        code: context.missingCode,
        details: context.details,
      });
    }

    throw ApiError.response({
      statusCode: HttpStatus.BAD_GATEWAY,
      message:
        context.invalidResponseMessage ??
        `Invalid response received from ${context.dependency}`,
      code:
        context.invalidResponseCode ?? ApiErrorCode.DEPENDENCY_INVALID_RESPONSE,
      details: context.details,
    });
  }

  static throwFromError(
    error: unknown,
    context: DependencyFailureContext,
  ): never {
    if (error instanceof ResponseException) throw error;

    if (axios.isAxiosError(error)) {
      const upstreamStatus =
        typeof error.response?.status === 'number' ? error.response.status : null;
      const upstreamCode =
        typeof error.response?.data?.error?.code === 'string'
          ? error.response.data.error.code
          : null;
      const baseDetails = {
        dependency: context.dependency,
        upstreamStatus,
        upstreamCode,
        reason: error.message,
        ...context.details,
      };

      if (context.missingCode && (upstreamStatus === 404 || upstreamCode === context.missingCode)) {
        throw ApiError.response({
          statusCode: context.missingStatusCode ?? HttpStatus.FAILED_DEPENDENCY,
          message:
            context.missingMessage ??
            `${context.dependency} configuration is not available`,
          code: context.missingCode,
          details: baseDetails,
        });
      }

      if (error.code === 'ECONNABORTED') {
        throw ApiError.response({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: `${context.dependency} request timed out`,
          code: ApiErrorCode.DEPENDENCY_TIMEOUT,
          details: baseDetails,
        });
      }

      if (upstreamStatus === null || upstreamStatus >= 500) {
        throw ApiError.response({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            context.unavailableMessage ??
            `${context.dependency} is currently unavailable`,
          code:
            context.unavailableCode ?? ApiErrorCode.DEPENDENCY_UNAVAILABLE,
          details: baseDetails,
        });
      }

      throw ApiError.response({
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          context.invalidResponseMessage ??
          `Invalid response received from ${context.dependency}`,
        code:
          context.invalidResponseCode ?? ApiErrorCode.DEPENDENCY_INVALID_RESPONSE,
        details: baseDetails,
      });
    }

    throw ApiError.response({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        context.unavailableMessage ??
        `${context.dependency} is currently unavailable`,
      code: context.unavailableCode ?? ApiErrorCode.DEPENDENCY_UNAVAILABLE,
      details: {
        dependency: context.dependency,
        reason: error instanceof Error ? error.message : String(error),
        ...context.details,
      },
    });
  }
}
