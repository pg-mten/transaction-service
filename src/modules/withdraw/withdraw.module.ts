// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { WithdrawTransactionService } from './withdraw.service';
import { WithdrawTransactionsController } from './withdraw.controller';

@Module({
  controllers: [WithdrawTransactionsController],
  providers: [WithdrawTransactionService],
  imports: [FeeModule],
})
export class WithdrawTransactionModule {}
