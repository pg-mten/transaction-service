import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

type CheckBalanceType = {
  balanceActive: Decimal;
  balancePending: Decimal;
};

export type CheckBalanceMerchantType = CheckBalanceType & {
  merchantId: number;
};

export type CheckBalanceAgentType = CheckBalanceType & {
  agentId: number;
};

export type CheckBalanceInternalType = CheckBalanceType;

@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Merchant Balance
   */
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
      merchantId: lastRow?.merchantId,
      balanceActive: lastRow?.balanceActive || new Decimal(0),
      balancePending: lastRow?.balancePending || new Decimal(0),
    } as CheckBalanceMerchantType;
  }

  async checkBalanceAllMerchant() {
    const lastRowMerchantAll = await this.prisma.merchantBalanceLog.findMany({
      distinct: ['merchantId'],
      orderBy: { createdAt: 'desc' },
      select: {
        merchantId: true,
        balanceActive: true,
        balancePending: true,
      },
    });
    return lastRowMerchantAll as CheckBalanceMerchantType[];
  }

  /**
   * Agent Balance
   */
  async checkBalanceAgents(agentIds: number[]) {
    const lastRowAgents = await this.prisma.agentBalanceLog.findMany({
      where: { agentId: { in: agentIds } },
      distinct: ['agentId'],
      orderBy: { createdAt: 'desc' },
      select: {
        agentId: true,
        balanceActive: true,
        balancePending: true,
      },
    });
    return lastRowAgents as CheckBalanceAgentType[];
  }

  async checkBalanceAllAgent() {
    const lastRowAgentAll = await this.prisma.agentBalanceLog.findMany({
      distinct: ['agentId'],
      orderBy: { createdAt: 'desc' },
      select: {
        agentId: true,
        balanceActive: true,
        balancePending: true,
      },
    });
    return lastRowAgentAll as CheckBalanceAgentType[];
  }

  /**
   * Internal Balance
   */
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
      balanceActive: lastRow?.balanceActive || new Decimal(0),
      balancePending: lastRow?.balancePending || new Decimal(0),
    } as CheckBalanceInternalType;
  }
}
