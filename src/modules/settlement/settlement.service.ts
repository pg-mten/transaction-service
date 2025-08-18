import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import { DateHelper } from 'src/shared/helper/date.helper';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  async setSettlement(merchantId: number) {
    const now = DateHelper.nowDate();
    const transactions = await this.prisma.purchaseTransaction.findMany({
      where: { merchantId, settlementAt: null },
      include: {
        feeDetails: true,
      },
    });
    if (!transactions) {
      throw new NotFoundException('Semua Transaksi sudah berhasil Settlement');
    }
    const lastLogBalanceMerchant =
      await this.prisma.merchantBalanceLog.findFirst({
        where: {
          merchantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    const lastBalance = lastLogBalanceMerchant?.balanceAfter || new Decimal(0);
    for (const trx of transactions) {
      await this.prisma.merchantBalanceLog.create({
        data: {
          merchantId,
          changeAmount: trx.merchantNetNominal || 0.0,
          purchaseId: trx.id,
          balanceAfter: lastBalance.plus(
            trx.merchantNetNominal || new Decimal(0),
          ), //last balance + netAmount
          reason: 'SETTLEMENT BY SYSTEM',
        },
      });
      for (const fees of trx.feeDetails) {
        if (!(fees.type == 'AGENT' && fees.agentId != null)) continue;
        const lastBalanceAgent = await this.prisma.agentBalanceLog.findFirst({
          where: {
            agentId: fees.agentId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        if (!lastBalanceAgent) continue;
        await this.prisma.agentBalanceLog.create({
          data: {
            agentId: fees.agentId,
            changeAmount: fees.nominal,
            purchaseId: trx.id,
            balanceAfter: lastBalanceAgent?.balanceAfter.plus(fees.nominal),
            reason: 'SETTLEMENT BY SYSTEM',
          },
        });
        await this.prisma.purchaseTransaction.update({
          where: {
            id: trx.id,
          },
          data: {
            settlementAt: now,
          },
        });
      }
    }
  }
}
