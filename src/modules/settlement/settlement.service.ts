import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  async setSettlement(merchantId: number) {
    const now = new Date();
    const transactions = await this.prisma.purchaseTransaction.findMany({
      where: {
        merchant_id: merchantId,
        settlement_at: null,
      },
      include: {
        fee_details: true,
      },
    });
    if (!transactions) {
      throw new NotFoundException('Semua Transaksi sudah berhasil Settlement');
    }
    const totalAmountMerchant = transactions.reduce(
      (n, item) => n + parseInt(item.net_amount.toString()),
      0,
    );
    for (const trx of transactions) {
      let feeAgent;
      const totalAmountAgent = trx.fee_details.reduce((n, item) => {
        if (item.type == 'AGENT') {
          return n + parseInt(item.amount.toString());
        }
      }, 0);
    }
    // update balance  in auth service
    const updated = await axios.post('http://localhost:3000/auth');
  }
}
