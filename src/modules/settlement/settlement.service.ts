import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import Decimal from 'decimal.js';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  async setSettlement(merchantId: number) {
    const transactions = await this.prisma.purchaseTransaction.findMany({
      where: {
        merchantId: merchantId,
        settlementAt: null,
      },
      include: {
        feeDetails: true,
      },
    });
    if (!transactions) {
      throw new NotFoundException('Semua Transaksi sudah berhasil Settlement');
    }
    const totalAmountMerchant = new Decimal(0);
    for (const trx of transactions) {
      if (trx.netAmount) totalAmountMerchant.plus(trx.netAmount);
    }
    // const totalAmountMerchant = transactions.reduce(
    //   (n, item) => n + parseInt(item.net_amount.toString()),
    //   0,
    // );
    for (const trx of transactions) {
      const totalAmountAgent = trx.feeDetails.reduce((n, item) => {
        if (item.type == 'AGENT') {
          return n + parseInt(item.amount.toString());
        }
      }, 0);
    }
    // update balance  in auth service
    const updated = await axios.post('http://localhost:3000/auth');
  }
}
