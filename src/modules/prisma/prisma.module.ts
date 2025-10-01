import { Global, Module } from '@nestjs/common';
import { prismaProvider } from './prisma.provider';

@Global()
@Module({
  providers: [prismaProvider],
  exports: [prismaProvider],
})
export class PrismaModule {}
