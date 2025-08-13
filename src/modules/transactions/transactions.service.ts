// src/transactions/transactions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { FeeTypeEnum, Prisma } from '@prisma/client';
import axios from 'axios';
import { FilterTransactionSettlementDto } from './dto/filter-transaction-settlement.dto';
import { DateHelper } from 'src/shared/helper/date.helper';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import Decimal from 'decimal.js';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { URL_CONFIG } from 'src/shared/constant/global.constant';
import { ResponseDto } from 'src/shared/response.dto';
import { PurchasingFeeDto } from './dto/fee/purchashing-fee.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    await this.prisma.$transaction(async (tx) => {
      const createdTransaction = await tx.purchaseTransaction.create({
        data: {
          externalId: dto.externalId,
          referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          provider: dto.provider,
          agentId: dto.agentId,
          amount: dto.amount,
          netAmount: dto.nettAmount,
          paymentMethod: dto.paymentMethod,
          metadata: dto.metadata,
          status: 'PENDING',
        },
      });
      const feeConfig: PurchasingFeeDto = await this.fetchFeeConfig({
        merchantId: 1,
        providerName: dto.provider,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
      });

      const feeDetails = this.mapFeeDetailResponse(feeConfig);

      const feeDetailPromises = [];
      for (const feeDetail of feeDetails) {
        const { type, amount, percentage } = feeDetail;
        feeDetailPromises.push(
          tx.purchaseFeeDetail.create({
            data: {
              purchaseTransactionId: createdTransaction.id,
              type: type,
              amount: amount,
              percentage: percentage,
            },
          }),
        );
      }
      await Promise.all(feeDetailPromises);

      return createdTransaction;
    });
  }

  private async fetchFeeConfig({
    merchantId,
    providerName,
    paymentMethod,
    amount,
  }: {
    merchantId: number;
    providerName: string;
    paymentMethod: string;
    amount: Decimal;
  }) {
    try {
      const { data } = await axios.get<ResponseDto<PurchasingFeeDto>>(
        `${URL_CONFIG}/fee/purchasing`,
        {
          params: {
            merchantId: merchantId,
            providerName: providerName,
            paymentMethodName: paymentMethod,
            nominal: amount.toFixed(2),
          },
        },
      );
      return data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private mapFeeDetailResponse(
    feeConfig: PurchasingFeeDto,
  ): { type: FeeTypeEnum; amount: Decimal; percentage: Decimal }[] {
    const result: {
      type: FeeTypeEnum;
      amount: Decimal;
      percentage: Decimal;
    }[] = [];
    if (feeConfig.internal?.nominal) {
      result.push({
        type: 'INTERNAL',
        amount: feeConfig.internal.nominal,
        percentage: feeConfig.internal.percentage,
      });
    }
    if (feeConfig.provider?.nominal) {
      result.push({
        type: 'PROVIDER',
        amount: feeConfig.provider.nominal,
        percentage: feeConfig.provider.percentage,
      });
    }
    if (feeConfig.agent?.nominal) {
      result.push({
        type: 'AGENT',
        amount: feeConfig.agent.nominal,
        percentage: feeConfig.agent.percentage,
      });
    }
    if (feeConfig.merchant?.merchantNetAmount) {
      result.push({
        type: 'MERCHANT',
        amount: feeConfig.merchant.merchantNetAmount,
        percentage: feeConfig.merchant.percentage,
      });
    }
    return result;
  }

  async findOneThrow(id: string) {
    return this.prisma.purchaseTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterTransactionDto) {
    const { from, to, merchantId, provider, paymentMethod, status } = query;
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
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;

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
