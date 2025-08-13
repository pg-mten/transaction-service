// src/transactions/transactions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { FilterTransactionSettlementDto } from './dto/filter-transaction-settlement.dto';
import { DateHelper } from 'src/shared/helper/date.helper';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import Decimal from 'decimal.js';
import { TransactionStatusEnum } from '@prisma/client';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    const createdTransaction = await this.prisma.purchaseTransaction.create({
      data: {
        externalId: dto.external_id,
        referenceId: dto.reference_id,
        merchantId: dto.merchant_id,
        provider: dto.provider,
        agentId: dto.agent_id,
        amount: new Decimal(dto.amount),
        netAmount: dto.nettAmount ? new Decimal(dto.nettAmount) : undefined,
        method: dto.method,
        metadata: dto.metadata,
        status: 'PENDING',
      },
    });
    const feeConfig = await this.fetchFeeConfig(
      1,
      'NETZME',
      'QRIS',
      dto.amount,
    );
    const feeDetails = this.mapFeeDetailResponse(feeConfig);
    await Promise.all(
      feeDetails.map(({ type, amount, percentage }) => {
        return this.prisma.feeDetail.create({
          data: {
            purchaseTransactionId: createdTransaction.id,
            type: type as any,
            amount: new Decimal(amount),
            percentage: new Decimal(percentage),
          },
        });
      }),
    );
    return createdTransaction;
  }

  private async fetchFeeConfig(
    merchantId: number,
    providerName: string,
    paymentMethod: string,
    amount: string,
  ) {
    try {
      const { data } = await axios.get(
        'http://192.168.18.176:3001/api/v1/fee/purchasing',
        {
          params: {
            merchantId: merchantId,
            providerName: providerName,
            paymentMethodName: paymentMethod,
            nominal: amount,
          },
        },
      );
      return data.data;
    } catch (error) {
      console.log(error);
    }
  }

  private mapFeeDetailResponse(
    response: any,
  ): { type: string; amount: string; percentage: string }[] {
    const result: { type: string; amount: string; percentage: string }[] = [];
    if (response.internal?.nominal) {
      result.push({
        type: 'INTERNAL',
        amount: response.internal.nominal,
        percentage: response.internal.percentage,
      });
    }
    if (response.provider?.nominal) {
      result.push({
        type: 'PROVIDER',
        amount: response.provider.nominal,
        percentage: response.provider.percentage,
      });
    }
    if (response.agent?.nominal) {
      result.push({
        type: 'AGENT',
        amount: response.agent.nominal,
        percentage: response.agent.percentage,
      });
    }
    if (response.merchant?.merchantNetAmount) {
      result.push({
        type: 'MERCHANT',
        amount: response.merchant.merchantNetAmount,
        percentage: response.merchant.percentage,
      });
    }
    return result;
  }

  async findOne(id: string) {
    return this.prisma.purchaseTransaction.findUnique({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterTransactionDto) {
    const { from, to, merchantId, provider, status } = query;
    const { skip, take } = paging(pageable);

    const fromDate = from
      ? startOfDay(new Date(from.toJSDate()))
      : subDays(new Date(), 7);
    const toDate = to
      ? endOfDay(new Date(to.toJSDate()))
      : endOfDay(new Date());

    const whereClause: Prisma.PurchaseTransactionWhereInput = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (merchantId) whereClause.merchantId = merchantId;
    if (provider) whereClause.provider = provider;
    if (status) whereClause.status = status;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.purchaseTransaction.count({
        where: whereClause,
      }),
      this.prisma.purchaseTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          feeDetails: true,
        },
      }),
    ]);
    const data = items.map((item) => {
      return new PurchaseTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        settlementAt: DateHelper.fromJsDate(item.settlementAt),
        reconciliationAt: DateHelper.fromJsDate(item.reconciliationAt),
      });
    });
    return new Page<any>({
      data: data,
      pageable,
      total,
    });

    // return {
    //   success: true,
    //   message: 'Daftar transaksi',
    //   data: {
    //     items,
    //     total,
    //     // page,
    //     // limit,
    //     totalPages: Math.ceil(total / take),
    //   },
    // };
  }

  async internalTransactionSettlement(filter: FilterTransactionSettlementDto) {
    const { from, to } = filter;
    return this.prisma.purchaseTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });
  }

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
