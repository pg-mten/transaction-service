// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { FeeModule } from '../fee/fee.module';
import { TransactionPurchaseService } from './transaction-purchase.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionPurchaseService],
  imports: [FeeModule],
})
export class TransactionsModule {}
