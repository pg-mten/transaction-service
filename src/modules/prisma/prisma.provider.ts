import { Provider } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { auditTrailExtension } from './extensions/audit.extension';

export const PRISMA_SERVICE = 'PrismaService';

export const PrismaProvider: Provider = {
  provide: PRISMA_SERVICE,
  useFactory: () => {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    //.$extends(auditTrailExtension); // TODO

    return prisma;
  },
};
