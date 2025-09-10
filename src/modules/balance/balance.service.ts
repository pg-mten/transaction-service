import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import {
  BalanceAgentDto,
  BalanceDto,
  BalanceMerchantDto,
} from './dto/balance.dto';
import { Prisma, TransactionTypeEnum } from '@prisma/client';

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
      select: {
        merchantId: true,
        balanceActive: true,
        balancePending: true,
      },
    });
    return new BalanceMerchantDto({
      merchantId: lastRow?.merchantId ?? merchantId,
      balanceActive: lastRow?.balanceActive || new Decimal(0),
      balancePending: lastRow?.balancePending || new Decimal(0),
    });
  }

  async aggregateBalanceMerchant() {
    const latestPerMerchant = await this.prisma.merchantBalanceLog.findMany({
      distinct: ['merchantId'],
      where: {
        transactionType: {
          in: [
            TransactionTypeEnum.WITHDRAW,
            TransactionTypeEnum.TOPUP,
            TransactionTypeEnum.DISBURSEMENT,
            TransactionTypeEnum.SETTLEMENT_PURCHASE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { balanceActive: true, balancePending: true },
    });
    console.log({ latestPerMerchant });
    let totalBalanceActive = new Decimal(0);
    let totalBalancePending = new Decimal(0);

    for (const merchant of latestPerMerchant) {
      totalBalanceActive = totalBalanceActive.plus(merchant.balanceActive);
      totalBalancePending = totalBalancePending.plus(merchant.balancePending);
    }

    return new BalanceDto({
      balanceActive: totalBalanceActive,
      balancePending: totalBalancePending,
    });

    /// TODO: Jangan di hapus => Performance
    // const result = await this.prisma.$queryRaw`
    //   WITH latest_logs AS (
    //     SELECT DISTINCT ON ("merchantId")
    //            "merchantId",
    //            "balanceActive",
    //            "balancePending",
    //            "createdAt"
    //     FROM transaction."MerchantBalanceLog"
    //     WHERE "transactionType" IN ('WITHDRAW', 'TOPUP', 'DISBURSEMENT', 'SETTLEMENT_PURCHASE')
    //     ORDER BY "merchantId", "createdAt" DESC
    //   )
    //   SELECT
    //       SUM("balanceActive")   AS "totalBalanceActive",
    //       SUM("balancePending")  AS "totalBalancePending"
    //   FROM latest_logs;
    // `;
  }

  /**
   * Agent Balance
   */
  async checkBalanceAgent(agentId: number) {
    const lastRow = await this.prisma.agentBalanceLog.findFirst({
      where: {
        agentId: agentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        agentId: true,
        balanceActive: true,
        balancePending: true,
      },
    });

    return new BalanceAgentDto({
      agentId: lastRow?.agentId ?? agentId,
      balanceActive: lastRow?.balanceActive ?? new Decimal(0),
      balancePending: lastRow?.balancePending ?? new Decimal(0),
    });
  }

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

    return lastRowAgents.map((balance) => {
      return new BalanceAgentDto({
        agentId: balance.agentId,
        balanceActive: balance.balanceActive,
        balancePending: balance.balancePending,
      });
    });
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

    return lastRowAgentAll.map((balance) => {
      return new BalanceAgentDto({
        agentId: balance.agentId,
        balanceActive: balance.balanceActive,
        balancePending: balance.balancePending,
      });
    });
  }

  async aggregateBalanceAgent() {
    const latestPerAgent = await this.prisma.agentBalanceLog.findMany({
      distinct: ['agentId'],
      where: {
        transactionType: {
          in: [
            TransactionTypeEnum.WITHDRAW,
            TransactionTypeEnum.TOPUP,
            TransactionTypeEnum.DISBURSEMENT,
            TransactionTypeEnum.SETTLEMENT_PURCHASE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { balanceActive: true, balancePending: true },
    });
    let totalBalanceActive = new Decimal(0);
    let totalBalancePending = new Decimal(0);

    for (const agent of latestPerAgent) {
      console.log({ agent });
      totalBalanceActive = totalBalanceActive.plus(agent.balanceActive);
      totalBalancePending = totalBalancePending.plus(agent.balancePending);
    }

    return new BalanceDto({
      balanceActive: totalBalanceActive,
      balancePending: totalBalancePending,
    });

    /// TODO: Jangan di hapus => Performance
    // const result = await this.prisma.$queryRaw`
    //   WITH latest_logs AS (
    //     SELECT DISTINCT ON ("agentId")
    //            "agentId",
    //            "balanceActive",
    //            "balancePending",
    //            "createdAt"
    //     FROM transaction."AgentBalanceLog"
    //     WHERE "transactionType" IN ('WITHDRAW', 'TOPUP', 'DISBURSEMENT', 'SETTLEMENT_PURCHASE')
    //     ORDER BY "agentId", "createdAt" DESC
    //   )
    //   SELECT
    //       SUM("balanceActive")   AS "totalBalanceActive",
    //       SUM("balancePending")  AS "totalBalancePending"
    //   FROM latest_logs;
    // `;
  }

  /**
   * Internal Balance
   */
  async aggregateBalanceInternal(providerName?: string | null) {
    const whereClause: Prisma.InternalBalanceLogWhereInput = {};

    whereClause.transactionType = {
      in: [
        TransactionTypeEnum.WITHDRAW,
        TransactionTypeEnum.TOPUP,
        TransactionTypeEnum.DISBURSEMENT,
        TransactionTypeEnum.SETTLEMENT_PURCHASE,
      ],
    };
    if (providerName) whereClause.providerName = providerName;

    const lastRow = await this.prisma.internalBalanceLog.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      select: { balanceActive: true, balancePending: true },
    });

    return new BalanceDto({
      balanceActive: lastRow?.balanceActive ?? new Decimal(0),
      balancePending: lastRow?.balancePending ?? new Decimal(0),
    });
  }

  async checkBalanceInternal() {
    const lastRow = await this.prisma.internalBalanceLog.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        balanceActive: true,
        balancePending: true,
      },
    });

    return new BalanceDto({
      balanceActive: lastRow?.balanceActive ?? new Decimal(0),
      balancePending: lastRow?.balancePending ?? new Decimal(0),
    });
  }
}
