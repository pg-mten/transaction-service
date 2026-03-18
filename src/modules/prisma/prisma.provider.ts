import { Provider } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { auditTrailExtension } from './extensions/audit.extension';
import { createPrismaAdapter } from './prisma.adapter';
import { timestampzExtension } from './extensions/timestampz.extension';

export const PRISMA_SERVICE = 'PrismaService';

export const PrismaProvider: Provider = {
  provide: PRISMA_SERVICE,
  useFactory: () => {
    const prisma = new PrismaClient({
      adapter: createPrismaAdapter(),
      log: ['query', 'info', 'warn', 'error'],
    })
      .$extends(auditTrailExtension)
      .$extends(timestampzExtension);

    return prisma;
  },
};
