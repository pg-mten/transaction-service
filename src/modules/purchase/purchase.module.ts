// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [PurchaseController],
  providers: [PurchaseService],
  imports: [FeeModule, BalanceModule],
})
export class PurchaseModule {}
