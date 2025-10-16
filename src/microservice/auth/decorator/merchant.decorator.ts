import { SetMetadata } from '@nestjs/common';

export const MERCHANT_API_KEY = 'MERCHANT_API_KEY';
export const MerchantApi = () => SetMetadata(MERCHANT_API_KEY, true);
