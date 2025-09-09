import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CellValue, Row, Worksheet } from 'exceljs';
import { FilterReconciliationDto } from './dto/filter-reconciliation.dto';
import { Prisma, TransactionStatusEnum } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { DateHelper } from 'src/shared/helper/date.helper';
import { PurchaseTransactionDto } from '../purchase/dto/purchase-transaction.dto';
import { FilterReconciliationCalculateDto } from './dto/filter-reconciliation-calculate.dto';
import Decimal from 'decimal.js';
import { ReconciliationCalculateDto } from './dto/reconciliation-calculate.dto';
import { PurchaseFeeDetailDto } from '../purchase/dto/purchase-fee-detail.dto';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  processCSV(data: Worksheet, providerName: string) {
    console.log({ providerName });
    const list: string[][] = [];
    data.eachRow((row: Row) => {
      const cells = row.values as CellValue[];
      console.log({ cells });
      const arr = cells.splice(1) as string[];
      console.log({ arr });
      const rowData = arr[0].split(';');
      list.push(rowData);
    });

    if (!list.length) {
      return [];
    }
    console.log({ list });
    const [headers, ...values] = list;
    console.log({ headers, values });
    const recons: { id: string; amount: number; method: string }[] = values.map(
      (items) => {
        // console.log({ items });
        return headers.reduce(
          (prev, current, index) => {
            // console.log({ prev, current, index });
            return Object.assign(prev, { [current]: items[index] });
          },
          { id: '', amount: 0, method: '' },
        );
      },
    );
    console.log({ recons });
    return recons;

    // const datas = await Promise.all(
    //   recons.map((recon) => {
    //     return this.prisma.purchaseTransaction.update({
    //       where: {
    //         provider: provider,
    //         externalId: recon.id,
    //         amount: recon.amount,
    //         paymentMethod: recon.method,
    //       },
    //       data: {
    //         reconciliationAt: DateHelper.nowDate(),
    //       },
    //     });
    //   }),
    // );
    // return datas;
  }

  async findAll(pageable: Pageable, filter: FilterReconciliationDto) {
    const { from, to, providerName, paymentMethodName } = filter;

    const whereClause: Prisma.PurchaseTransactionWhereInput = {};

    whereClause.status = TransactionStatusEnum.SUCCESS;
    whereClause.settlementAt = { not: null };
    whereClause.reconciliationAt = { not: null };

    if (providerName) whereClause.providerName = providerName;
    if (paymentMethodName) whereClause.paymentMethodName = paymentMethodName;
    if (from && to) {
      whereClause.createdAt = {
        gte: from.toJSDate(),
        lte: to.toJSDate(),
      };
    }

    const { skip, take } = paging(pageable);
    const [total, items] = await Promise.all([
      this.prisma.purchaseTransaction.count({
        where: whereClause,
      }),
      this.prisma.purchaseTransaction.findMany({
        skip,
        take,
        where: whereClause,
        include: { feeDetails: true },
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

  async calculate(filter: FilterReconciliationCalculateDto) {
    const { from, to, providerName, paymentMethodName } = filter;

    const whereClause: Prisma.PurchaseTransactionWhereInput = {};

    whereClause.status = TransactionStatusEnum.SUCCESS;
    whereClause.settlementAt = { not: null };
    whereClause.reconciliationAt = { not: null };

    if (providerName) whereClause.providerName = providerName;
    if (paymentMethodName) whereClause.paymentMethodName = paymentMethodName;
    if (from && to) {
      whereClause.createdAt = {
        gte: from.toJSDate(),
        lte: to.toJSDate(),
      };
    }

    const sumNominal = await this.prisma.purchaseTransaction.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: {
        nominal: true,
      },
    });
    const count: number = sumNominal._count.id;
    const nominal: Decimal = sumNominal._sum.nominal ?? new Decimal(0);

    return new ReconciliationCalculateDto({
      count,
      nominal,
    });
  }

  /// Jumlah Purchase yang belum unrecon
  /// Calculate Nominal yang belum unrecon
}
