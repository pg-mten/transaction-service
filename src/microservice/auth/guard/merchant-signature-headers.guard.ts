import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiError } from 'src/shared/exception';
import { MERCHANT_API_KEY } from '../decorator/merchant.decorator';

const REQUIRED_SIGNATURE_HEADERS = [
  'x-client-id',
  'x-timestamp',
  'x-nonce',
  'x-signature',
  'x-sign-alg',
] as const;

@Injectable()
export class MerchantSignatureHeadersGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isMerchantApi = this.reflector.getAllAndOverride<boolean>(
      MERCHANT_API_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isMerchantApi) return true;

    const request: Request = context.switchToHttp().getRequest();
    const headers = request.headers as Record<
      string,
      string | string[] | undefined
    >;

    const missingHeaders = REQUIRED_SIGNATURE_HEADERS.filter((header) => {
      const value = headers[header];
      if (Array.isArray(value)) return value.length === 0;
      return !value;
    });

    if (missingHeaders.length > 0) {
      throw ApiError.missingSignatureHeaders([...missingHeaders]);
    }

    return true;
  }
}
