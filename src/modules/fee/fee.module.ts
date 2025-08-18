import { Module } from '@nestjs/common';
import { FeePurchaseService } from './purchase/fee-purchase.service';

@Module({
  providers: [FeePurchaseService],
  exports: [FeePurchaseService],
})
export class FeeModule {}
