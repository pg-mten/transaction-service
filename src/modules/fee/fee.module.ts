import { Module } from '@nestjs/common';
import { FeeCalculateService } from './fee-calculate.service';

@Module({
  providers: [FeeCalculateService],
  exports: [FeeCalculateService],
})
export class FeeModule {}
