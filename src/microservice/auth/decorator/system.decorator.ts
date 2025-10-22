import { SetMetadata } from '@nestjs/common';

export const SYSTEM_API_KEY = 'SYSTEM_API_KEY';
export const SystemApi = () => SetMetadata(SYSTEM_API_KEY, true);
