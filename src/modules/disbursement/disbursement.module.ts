// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { DisbursementTransactionService } from './disbursement.service';
import { DisbursementTransactionsController } from './disbursement.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [DisbursementTransactionsController],
  providers: [DisbursementTransactionService],
  imports: [FeeModule, BalanceModule],
})
export class DisbursementTransactionModule {}
