import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface MerchantSignatureHeaderDto {
  xClientId: string;
  xTimestamp: string;
  xNonce: string;
  xSignature: string;
  xSignAlg: string;
}

export const MerchantSignatureHeader = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): MerchantSignatureHeaderDto => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers as Record<
      string,
      string | string[] | undefined
    >;
    const getHeaderValue = (key: string): string => {
      const value = headers[key];
      if (Array.isArray(value)) return value[0] || '';
      return value || '';
    };

    return {
      xClientId: getHeaderValue('x-client-id'),
      xTimestamp: getHeaderValue('x-timestamp'),
      xNonce: getHeaderValue('x-nonce'),
      xSignature: getHeaderValue('x-signature'),
      xSignAlg: getHeaderValue('x-sign-alg'),
    };
  },
);
