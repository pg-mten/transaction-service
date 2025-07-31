import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CellValue, Row, Worksheet } from 'exceljs';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  format(data: Worksheet) {
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
    return values.map((items) => {
      console.log({ items });
      console.log('aaa');

      return headers.reduce((prev, current, index) => {
        console.log({ prev, current, index });
        return Object.assign(prev, { [current]: items[index] });
      }, {});
    });
  }
}
