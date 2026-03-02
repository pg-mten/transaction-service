import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';
import { Prisma, TransactionTypeEnum } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import Decimal from 'decimal.js';
import { PurchaseFeeDetailDto } from './dto/purchase-fee-detail.dto';
import { UpdateStatusPurchaseTransactionDto } from './dto/update-transaction-status.dto';
import { ReadPurchaseDateRequestApi } from '../api/v1/dto-api/read-purchase-date.request.api';
import { ReadPurchaseDateResponseApi } from '../api/v1/dto-api/read-purchase-date.response.api';
import { CsvColumn, CsvHelper } from 'src/shared/helper/csv.helper';

@Injectable()
export class PurchaseService {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaClient) {}

  private readonly transactionType = TransactionTypeEnum.PURCHASE;

  async findOneThrow(id: number) {
    return this.prisma.purchaseTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findOneUniqueThrow(
    whereClause: Prisma.PurchaseTransactionWhereUniqueInput,
  ) {
    return this.prisma.purchaseTransaction.findUniqueOrThrow({
      where: whereClause,
    });
  }

  async findByPaidDate(
    pageable: Pageable,
    merchantId: number,
    filter: ReadPurchaseDateRequestApi,
  ) {
    const whereClause: Prisma.PurchaseTransactionWhereInput = {
      merchantId: merchantId,
      paidAt: {
        gte: filter.from.toJSDate(),
        lte: filter.to.toJSDate(),
      },
    };
    const { skip, take } = paging(pageable);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.purchaseTransaction.count({ where: whereClause }),
      this.prisma.purchaseTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    const purchaseDtos = items.map((purchase) => {
      return new ReadPurchaseDateResponseApi({
        transactionId: purchase.id,
        orderId: purchase.orderId,
        amount: purchase.nominal,
        netAmount: purchase.netNominal,
        fee: purchase.nominal.minus(purchase.netNominal),
        paidAt: purchase.paidAt?.toISOString() ?? null,
        paymentMethod: purchase.paymentMethodName,
        status: purchase.status,
      });
    });

    return new Page<ReadPurchaseDateResponseApi>({
      pageable,
      total,
      data: purchaseDtos,
    });
  }

  async findAll(pageable: Pageable, query: FilterPurchaseDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

    const fromDate = from
      ? startOfDay(from.toJSDate())
      : subDays(DateHelper.nowJSDate(), 7);
    const toDate = to
      ? endOfDay(to.toJSDate())
      : endOfDay(DateHelper.nowJSDate());

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
          paidAt: DateHelper.fromJsDate(item.paidAt),
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

  async findAllCsv(pageable: Pageable, query: FilterPurchaseDto): Promise<string> {
    const page = await this.findAll(pageable, query);
    const columns: CsvColumn<PurchaseTransactionDto>[] = [
      { header: 'id', value: (item) => item.id },
      { header: 'externalId', value: (item) => item.externalId },
      { header: 'referenceId', value: (item) => item.referenceId },
      { header: 'merchantId', value: (item) => item.merchantId },
      { header: 'providerName', value: (item) => item.providerName },
      { header: 'paymentMethodName', value: (item) => item.paymentMethodName },
      { header: 'nominal', value: (item) => item.nominal },
      { header: 'netNominal', value: (item) => item.netNominal },
      { header: 'totalFeeCut', value: (item) => item.totalFeeCut },
      { header: 'status', value: (item) => item.status },
      { header: 'metadata', value: (item) => item.metadata },
      { header: 'settlementAt', value: (item) => item.settlementAt },
      { header: 'reconciliationAt', value: (item) => item.reconciliationAt },
      { header: 'paidAt', value: (item) => item.paidAt },
      { header: 'createdAt', value: (item) => item.createdAt },
      { header: 'feeDetails', value: (item) => item.feeDetails },
    ];
    return CsvHelper.build(page.data, columns);
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
