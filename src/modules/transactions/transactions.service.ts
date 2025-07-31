// src/transactions/transactions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { FilterTransactionSettlementDto } from './dto/filter-transaction-settlement.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    const createdTransaction = await this.prisma.purchaseTransaction.create({
      data: {
        external_id: dto.external_id,
        reference_id: dto.reference_id,
        merchant_id: dto.merchant_id,
        provider_id: dto.provider_id,
        agent_id: dto.agent_id,
        amount: new Prisma.Decimal(dto.amount),
        nettAmount: dto.nettAmount
          ? new Prisma.Decimal(dto.nettAmount)
          : undefined,
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
            purchase_transaction_id: createdTransaction.id,
            type: type as any,
            amount: new Prisma.Decimal(amount),
            percentage: new Prisma.Decimal(percentage),
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
        fee_details: true,
      },
    });
  }

  async findAll(query: FilterTransactionDto) {
    const {
      page = 1,
      limit = 10,
      from,
      to,
      merchantId,
      providerId,
      status,
    } = query;

    const skip = (page - 1) * limit;
    const fromDate = from ? startOfDay(new Date(from)) : subDays(new Date(), 7);
    const toDate = to ? endOfDay(new Date(to)) : endOfDay(new Date());

    const whereClause: any = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (merchantId) whereClause.merchantId = merchantId;
    if (providerId) whereClause.providerId = providerId;
    if (status) whereClause.status = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseTransaction.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          fee_details: true,
        },
      }),
      this.prisma.purchaseTransaction.count({
        where: whereClause,
      }),
    ]);

    return {
      success: true,
      message: 'Daftar transaksi',
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async internalTransactionSettlement(filter: FilterTransactionSettlementDto) {
    const { from, to } = filter;
    return this.prisma.purchaseTransaction.findMany({
      where: {
        created_at: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });
  }

  async handleWebhook(external_id: string, newStatus: string, rawPayload: any) {
    const trx = await this.prisma.purchaseTransaction.findUnique({
      where: { external_id },
    });
    if (!trx) throw new NotFoundException('Transaction not found');

    if (['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(trx.status)) {
      return { message: 'Transaction already finalized' };
    }

    const updated = await this.prisma.purchaseTransaction.update({
      where: { external_id },
      data: {
        status: newStatus as any,
        updated_at: new Date(),
      },
    });

    await this.prisma.purchaseTransactionAudit.create({
      data: {
        transaction_id: updated.id,
        old_status: trx.status,
        new_status: newStatus as any,
        source: 'webhook',
        created_at: new Date(),
      },
    });

    await this.prisma.webhookLog.create({
      data: {
        transaction_id: updated.id,
        source: 'provider',
        payload: rawPayload,
        received_at: new Date(),
      },
    });

    return { message: 'Webhook processed', status: updated.status };
  }
}
