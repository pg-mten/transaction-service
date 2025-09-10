// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { TopupService } from './topup.service';
import { TopupTransactionsController } from './topup.controller';
import { BalanceModule } from '../balance/balance.module';
import { SettlementModule } from '../settlement/settlement.module';

@Module({
  controllers: [TopupTransactionsController],
  providers: [TopupService],
  imports: [FeeModule, BalanceModule, SettlementModule],
})
export class TopupTransactionModule {}
