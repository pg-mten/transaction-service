import { Provider } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { auditTrailExtension } from './extensions/audit.extension';

export const PRISMA_SERVICE = 'PrismaService';

export const prismaProvider: Provider = {
  provide: PRISMA_SERVICE,
  useFactory: () => {
    return new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    }).$extends(auditTrailExtension);
  },
};
