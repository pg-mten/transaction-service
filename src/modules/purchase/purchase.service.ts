import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TransactionTypeEnum } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import Decimal from 'decimal.js';
import { PurchaseFeeDetailDto } from './dto/purchase-fee-detail.dto';
import { UpdateStatusPurchaseTransactionDto } from './dto/update-transaction-status.dto';
@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly transactionType = TransactionTypeEnum.PURCHASE;

  async findOneThrow(id: number) {
    return this.prisma.purchaseTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterPurchaseDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

    const fromDate = from
      ? startOfDay(from.toJSDate())
      : subDays(DateHelper.nowDate(), 7);
    const toDate = to
      ? endOfDay(to.toJSDate())
      : endOfDay(DateHelper.nowDate());

    const whereClause: Prisma.PurchaseTransactionWhereInput = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (merchantId) whereClause.merchantId = merchantId;
    if (providerName) whereClause.providerName = providerName;
    if (status) whereClause.status = status;
    if (paymentMethodName) whereClause.paymentMethodName = paymentMethodName;

    const { skip, take } = paging(pageable);
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
    const purchaseDtos: PurchaseTransactionDto[] = [];
    for (const item of items) {
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: PurchaseFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new PurchaseFeeDetailDto({ ...feeDetail }));
      }
      purchaseDtos.push(
        new PurchaseTransactionDto({
          ...item,
          totalFeeCut,
          metadata: item.metadata as Record<string, unknown>,
          settlementAt: DateHelper.fromJsDate(item.settlementAt),
          reconciliationAt: DateHelper.fromJsDate(item.reconciliationAt),
          createdAt: DateHelper.fromJsDate(item.createdAt)!,
          feeDetails: feeDetailDtos,
        }),
      );
    }

    return new Page<PurchaseTransactionDto>({
      pageable,
      total,
      data: purchaseDtos,
    });
  }

  /// TODO Buat apa ?
  async updateStatusTransactions(data: UpdateStatusPurchaseTransactionDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseTransaction.update({
        where: {
          code: data.code,
        },
        data: {
          status: data.status,
          metadata: data.metadata,
          externalId: data.external_id,
        },
      });
    });
  }
}
