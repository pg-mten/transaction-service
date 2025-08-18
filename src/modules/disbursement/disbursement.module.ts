// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { DisbursementTransactionService } from './disbursement.service';
import { DisbursementTransactionsController } from './disbursement.controller';

@Module({
  controllers: [DisbursementTransactionsController],
  providers: [DisbursementTransactionService],
  imports: [FeeModule],
})
export class DisbursementTransactionModule {}
