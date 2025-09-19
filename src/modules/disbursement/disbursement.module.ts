// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { DisbursementService } from './disbursement.service';
import { DisbursementTransactionsController } from './disbursement.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [DisbursementTransactionsController],
  providers: [DisbursementService],
  imports: [BalanceModule],
})
export class DisbursementTransactionModule {}
