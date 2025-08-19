import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  async checkBalanceMerchant(merchantId: number) {
    const lastRow = await this.prisma.merchantBalanceLog.findFirst({
      where: {
        merchantId: merchantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return lastRow?.balanceAfter;
  }

  async checkBalanceAgent(agentId: number) {
    const lastRow = await this.prisma.agentBalanceLog.findFirst({
      where: {
        agentId,
      },
      orderBy: {
        createdAt: 'desc',
        id: 'desc',
      },
    });
    return lastRow?.balanceAfter;
  }

  async checkBalanceInternal(providerName: string) {
    let whereClause = {};
    if (providerName) {
      whereClause = { providerName: providerName };
    }
    const lastRow = await this.prisma.internalBalanceLog.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return lastRow?.balanceAfter;
  }
}
