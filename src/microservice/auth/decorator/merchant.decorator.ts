import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const MERCHANT_API_KEY = 'MERCHANT_API_KEY';

const MERCHANT_SIGNATURE_HEADERS = [
  {
    name: 'x-client-id',
    description: 'Merchant client identifier',
  },
  {
    name: 'x-timestamp',
    description: 'Request timestamp used to validate the signature',
  },
  {
    name: 'x-nonce',
    description: 'Unique nonce used to prevent request replay',
  },
  {
    name: 'x-signature',
    description: 'HMAC signature for the request',
  },
  {
    name: 'x-sign-alg',
    description: 'Signature algorithm used for the request',
  },
] as const;

export const MerchantApi = () =>
  applyDecorators(
    SetMetadata(MERCHANT_API_KEY, true),
    ...MERCHANT_SIGNATURE_HEADERS.map((header) =>
      ApiHeader({
        ...header,
        required: false,
      }),
    ),
  );
