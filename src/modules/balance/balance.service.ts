import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

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
    return {
      active: lastRow?.balanceActive || new Decimal(0),
      pending: lastRow?.balancePending || new Decimal(0),
    };
  }

  async checkBalanceAgent(agentId: number) {
    const lastRow = await this.prisma.agentBalanceLog.findFirst({
      where: {
        agentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      active: lastRow?.balanceActive || new Decimal(0),
      pending: lastRow?.balancePending || new Decimal(0),
    };
  }

  async checkBalanceInternal(providerName?: string) {
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

    return {
      active: lastRow?.balanceActive || new Decimal(0),
      pending: lastRow?.balancePending || new Decimal(0),
    };
  }

  async checkBalanceAllMerchant() {
    return await this.prisma.merchantBalanceLog.findMany({
      distinct: ['merchantId'],
      orderBy: { createdAt: 'desc' },
      select: {
        merchantId: true,
        balanceActive: true,
        balancePending: true,
      },
    });
  }

  async checkBalanceAllAgent() {
    return await this.prisma.agentBalanceLog.findMany({
      distinct: ['agentId'],
      orderBy: { createdAt: 'desc' },
      select: {
        agentId: true,
        balanceActive: true,
        balancePending: true,
      },
    });
  }
}
