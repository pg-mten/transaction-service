import { HttpStatus } from '@nestjs/common';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { InvalidRequestException } from './invalid-request.exception';
import { ResponseException } from './response.exception';

type ApiErrorInput = {
  statusCode: number;
  message: string;
  code: string;
  details?: Record<string, unknown> | null;
  fields?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
};

export type DependencyFailureContext = {
  dependency: string;
  unavailableCode?: string;
  unavailableMessage?: string;
  invalidResponseCode?: string;
  invalidResponseMessage?: string;
  missingCode?: string;
  missingMessage?: string;
  missingStatusCode?: number;
  details?: Record<string, unknown>;
};

export const ApiErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  MISSING_SIGNATURE_HEADERS: 'MISSING_SIGNATURE_HEADERS',
  INVALID_PATH_PARAMETER: 'INVALID_PATH_PARAMETER',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_DECIMAL: 'INVALID_DECIMAL',
  INVALID_DATE: 'INVALID_DATE',
  CALLBACK_CODE_INVALID: 'CALLBACK_CODE_INVALID',
  DATE_RANGE_INVALID: 'DATE_RANGE_INVALID',
  PURCHASE_NOT_FOUND: 'PURCHASE_NOT_FOUND',
  DISBURSEMENT_NOT_FOUND: 'DISBURSEMENT_NOT_FOUND',
  ORDER_ID_CONFLICT: 'ORDER_ID_CONFLICT',
  MERCHANT_BALANCE_INSUFFICIENT: 'MERCHANT_BALANCE_INSUFFICIENT',
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
  PROVIDER_PROFILE_NOT_CONFIGURED: 'PROVIDER_PROFILE_NOT_CONFIGURED',
  FEE_CONFIG_INVALID: 'FEE_CONFIG_INVALID',
  INTERNAL_PROVIDER_UNSUPPORTED: 'INTERNAL_PROVIDER_UNSUPPORTED',
  DEPENDENCY_TIMEOUT: 'DEPENDENCY_TIMEOUT',
  DEPENDENCY_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
  DEPENDENCY_INVALID_RESPONSE: 'DEPENDENCY_INVALID_RESPONSE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const DependencyErrorContext = {
  auth: {
    merchantSignatureValidation: {
      dependency: 'Auth service merchant signature validation',
      unavailableMessage:
        'Auth service is unavailable for merchant signature validation',
      invalidResponseMessage:
        'Invalid response received from auth service during merchant signature validation',
    } satisfies DependencyFailureContext,
    merchantUrlLookup: {
      dependency: 'Auth service merchant URL lookup',
      unavailableMessage: 'Auth service is unavailable for merchant URL lookup',
      invalidResponseMessage:
        'Invalid response received from auth service during merchant URL lookup',
    } satisfies DependencyFailureContext,
  },
  config: {
    providerProfileLookup: {
      dependency: 'Config service provider profile lookup',
      unavailableMessage:
        'Config service is unavailable for provider profile lookup',
      missingCode: ApiErrorCode.PROVIDER_PROFILE_NOT_CONFIGURED,
      missingMessage: 'Provider profile is not configured for this merchant',
    } satisfies DependencyFailureContext,
    purchaseFeeLookup: {
      dependency: 'Config service purchase fee lookup',
      unavailableMessage:
        'Config service is unavailable for purchase fee lookup',
      missingCode: ApiErrorCode.FEE_CONFIG_INVALID,
      missingMessage: 'Purchase fee configuration is not available',
    } satisfies DependencyFailureContext,
    withdrawFeeLookup: {
      dependency: 'Config service withdraw fee lookup',
      unavailableMessage:
        'Config service is unavailable for withdraw fee lookup',
      missingCode: ApiErrorCode.FEE_CONFIG_INVALID,
      missingMessage: 'Withdraw fee configuration is not available',
    } satisfies DependencyFailureContext,
    topupFeeLookup: {
      dependency: 'Config service topup fee lookup',
      unavailableMessage: 'Config service is unavailable for topup fee lookup',
      missingCode: ApiErrorCode.FEE_CONFIG_INVALID,
      missingMessage: 'Topup fee configuration is not available',
    } satisfies DependencyFailureContext,
    disbursementFeeLookup: {
      dependency: 'Config service disbursement fee lookup',
      unavailableMessage:
        'Config service is unavailable for disbursement fee lookup',
      missingCode: ApiErrorCode.FEE_CONFIG_INVALID,
      missingMessage: 'Disbursement fee configuration is not available',
    } satisfies DependencyFailureContext,
  },
  settlerecon: {
    inacashPurchaseProvider: {
      dependency: 'Settlerecon Inacash purchase provider',
      unavailableMessage: 'Inacash purchase provider is unavailable',
    } satisfies DependencyFailureContext,
    inacashWithdrawProvider: {
      dependency: 'Settlerecon Inacash withdraw provider',
      unavailableMessage: 'Inacash withdraw provider is unavailable',
    } satisfies DependencyFailureContext,
    inacashDisbursementProvider: {
      dependency: 'Settlerecon Inacash disbursement provider',
      unavailableMessage: 'Inacash disbursement provider is unavailable',
    } satisfies DependencyFailureContext,
    pdnPurchaseProvider: {
      dependency: 'Settlerecon PDN purchase provider',
      unavailableMessage: 'PDN purchase provider is unavailable',
    } satisfies DependencyFailureContext,
    pdnWithdrawProvider: {
      dependency: 'Settlerecon PDN withdraw provider',
      unavailableMessage: 'PDN withdraw provider is unavailable',
    } satisfies DependencyFailureContext,
    pdnDisbursementProvider: {
      dependency: 'Settlerecon PDN disbursement provider',
      unavailableMessage: 'PDN disbursement provider is unavailable',
    } satisfies DependencyFailureContext,
    pakaidonkPurchaseProvider: {
      dependency: 'Settlerecon Pakaidonk purchase provider',
      invalidResponseMessage: 'Pakaidonk provider is unavailable',
    } satisfies DependencyFailureContext,
  },
} as const;

export class ApiError {
  static response({
    statusCode,
    message,
    code,
    details,
    fields,
    meta,
  }: ApiErrorInput): ResponseException {
    return ResponseException.from({
      statusCode,
      message,
      code,
      details: details ?? null,
      fields: fields ?? null,
      meta: meta ?? null,
    });
  }

  static invalidRequest({
    statusCode,
    message,
    code,
    details,
    fields,
    meta,
  }: ApiErrorInput): InvalidRequestException {
    return new InvalidRequestException(
      new ResponseDto<null>({
        statusCode,
        status: ResponseStatus.ERROR,
        message,
        error: {
          code,
          ...(details ? { details } : {}),
          ...(fields ? { fields } : {}),
        },
        meta: meta ?? undefined,
      }),
    );
  }

  static invalidMerchantSignature(): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Merchant signature is not valid',
      code: ApiErrorCode.UNAUTHORIZED,
    });
  }

  static missingSignatureHeaders(missingHeaders: string[]): ResponseException {
    return this.response({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Missing required merchant signature headers',
      code: ApiErrorCode.MISSING_SIGNATURE_HEADERS,
      details: { missingHeaders },
      fields: Object.fromEntries(
        missingHeaders.map((header) => [header, 'Header is required']),
      ),
    });
  }

  static invalidPathParameter(
    field: string,
    reason = 'Expected an integer value',
  ): ResponseException {
    return this.response({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Invalid path parameter '${field}'`,
      code: ApiErrorCode.INVALID_PATH_PARAMETER,
      fields: {
        [field]: reason,
      },
    });
  }

  static validationFailed(
    fields: Record<string, string>,
  ): InvalidRequestException {
    return this.invalidRequest({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Request validation failed',
      code: ApiErrorCode.VALIDATION_FAILED,
      fields,
    });
  }

  static invalidDecimal(field: string, value: unknown): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: `Field '${field}' must be a valid decimal value`,
      code: ApiErrorCode.INVALID_DECIMAL,
      fields: {
        [field]: `Invalid decimal value: ${value}`,
      },
    });
  }

  static invalidDate(field: string, value: unknown): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: `Field '${field}' must be a valid date-time`,
      code: ApiErrorCode.INVALID_DATE,
      fields: {
        [field]: `Invalid date value: ${value}`,
      },
    });
  }

  static callbackCodeInvalid(): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Callback code format is invalid',
      code: ApiErrorCode.CALLBACK_CODE_INVALID,
    });
  }

  static dateRangeInvalid(): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: `'from' must be earlier than or equal to 'to'`,
      code: ApiErrorCode.DATE_RANGE_INVALID,
      fields: {
        from: `'from' must be earlier than or equal to 'to'`,
      },
    });
  }

  static purchaseNotFound(
    identifierLabel: string,
    identifier: string | number,
  ) {
    return this.response({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Purchase with ${identifierLabel} ${identifier} not found`,
      code: ApiErrorCode.PURCHASE_NOT_FOUND,
    });
  }

  static disbursementNotFound(
    identifierLabel: string,
    identifier: string | number,
  ) {
    return this.response({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Transfer with ${identifierLabel} ${identifier} not found`,
      code: ApiErrorCode.DISBURSEMENT_NOT_FOUND,
    });
  }

  static unsupportedProvider(providerName: string): ResponseException {
    return this.response({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `Provider with name ${providerName} is not supported`,
      code: ApiErrorCode.INTERNAL_PROVIDER_UNSUPPORTED,
    });
  }

  static orderIdConflict(subject: 'Purchase' | 'Transfer', orderId: string) {
    return this.response({
      statusCode: HttpStatus.CONFLICT,
      message: `${subject} order ID '${orderId}' already exists`,
      code: ApiErrorCode.ORDER_ID_CONFLICT,
    });
  }

  static insufficientMerchantBalance(): ResponseException {
    return this.response({
      statusCode: HttpStatus.CONFLICT,
      message: 'Balance insufficient',
      code: ApiErrorCode.MERCHANT_BALANCE_INSUFFICIENT,
    });
  }

  static providerRejected(
    message: string,
    details?: Record<string, unknown>,
  ): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message,
      code: ApiErrorCode.PROVIDER_REJECTED,
      details,
    });
  }

  static feeConfigInvalid(
    details?: Record<string, unknown>,
  ): ResponseException {
    return this.response({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Some response fields are null',
      code: ApiErrorCode.FEE_CONFIG_INVALID,
      details,
    });
  }
}
