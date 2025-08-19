// src/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { FeeModule } from '../fee/fee.module';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';

@Module({
  controllers: [PurchaseController],
  providers: [PurchaseService],
  imports: [FeeModule],
})
export class PurchaseModule {}
