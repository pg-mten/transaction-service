import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CellValue, Row, Worksheet } from 'exceljs';
import { FilterReconciliationDto } from './dto/filter-reconciliation.dto';
import { Prisma, TransactionStatusEnum } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { DateHelper } from 'src/shared/helper/date.helper';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async processCSV(data: Worksheet, provider: string) {
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
    const { from, to, provider } = filter;

    const where: Prisma.PurchaseTransactionWhereInput = {
      status: TransactionStatusEnum.SUCCESS,
      reconciliationAt: null,
      createdAt: {
        gte: from,
        lte: to,
      },
      ...(provider && { provider: provider }),
    };

    const { skip, take } = paging(pageable);

    const [total, recons] = await Promise.all([
      this.prisma.purchaseTransaction.count({
        where,
      }),
      this.prisma.purchaseTransaction.findMany({
        skip,
        take,
        where: where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return new Page<object>({
      data: recons,
      pageable,
      total,
    });
  }
}
