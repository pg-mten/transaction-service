// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { TopupTransactionService } from './topup.service';
import { TopupTransactionsController } from './topup.controller';

@Module({
  controllers: [TopupTransactionsController],
  providers: [TopupTransactionService],
  imports: [FeeModule],
})
export class TopupTransactionModule {}
