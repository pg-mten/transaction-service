import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [PurchaseController],
  providers: [PurchaseService],
  imports: [BalanceModule],
})
export class PurchaseModule {}
