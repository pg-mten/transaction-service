// src/transactions/transactions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterTransactionSettlementDto } from './dto/filter-transaction-settlement.dto';
import { DateHelper } from 'src/shared/helper/date.helper';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  /// TODO: Transaction dan Settlement masih dijadikan satu
  // async internalTransactionSettlement(filter: FilterTransactionSettlementDto) {
  //   const { from, to } = filter;
  //   return this.prisma.purchaseTransaction.findMany({
  //     where: {
  //       createdAt: {
  //         gte: new Date(from),
  //         lte: new Date(to),
  //       },
  //     },
  //   });
  // }

  async handleWebhook(external_id: string, newStatus: string, rawPayload: any) {
    const trx = await this.prisma.purchaseTransaction.findUnique({
      where: { externalId: external_id },
    });
    if (!trx) throw new NotFoundException('Transaction not found');

    if (['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(trx.status)) {
      return { message: 'Transaction already finalized' };
    }

    const updated = await this.prisma.purchaseTransaction.update({
      where: { externalId: external_id },
      data: {
        status: newStatus as any,
        updatedAt: DateHelper.nowDate(),
      },
    });

    await this.prisma.purchaseTransactionAudit.create({
      data: {
        transactionId: updated.id,
        oldStatus: trx.status,
        newStatus: newStatus as any,
        source: 'webhook',
        createdAt: DateHelper.nowDate(),
      },
    });

    await this.prisma.webhookLog.create({
      data: {
        transactionId: updated.id,
        source: 'provider',
        payload: rawPayload,
        receivedAt: DateHelper.nowDate(),
      },
    });

    return { message: 'Webhook processed', status: updated.status };
  }
}
