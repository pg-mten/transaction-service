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
    const headers = request.headers;
    return {
      xClientId: headers['x-client-id'],
      xTimestamp: headers['x-timestamp'],
      xNonce: headers['x-nonce'],
      xSignature: headers['x-signature'],
      xSignAlg: headers['x-sign-alg'],
    };
  },
);
