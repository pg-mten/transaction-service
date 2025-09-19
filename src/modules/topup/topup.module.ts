import { Module } from '@nestjs/common';
import { TopupService } from './topup.service';
import { TopupTransactionsController } from './topup.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [TopupTransactionsController],
  providers: [TopupService],
  imports: [BalanceModule],
})
export class TopupTransactionModule {}
