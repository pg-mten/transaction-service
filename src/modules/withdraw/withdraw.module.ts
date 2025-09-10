// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { WithdrawService } from './withdraw.service';
import { WithdrawTransactionsController } from './withdraw.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [WithdrawTransactionsController],
  providers: [WithdrawService],
  imports: [FeeModule, BalanceModule],
})
export class WithdrawTransactionModule {}
