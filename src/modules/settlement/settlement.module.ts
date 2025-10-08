import { Module } from '@nestjs/common';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
  imports: [BalanceModule],
})
export class SettlementModule {}
