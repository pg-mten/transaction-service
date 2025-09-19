import { Module } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { WithdrawTransactionsController } from './withdraw.controller';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [WithdrawTransactionsController],
  providers: [WithdrawService],
  imports: [BalanceModule],
})
export class WithdrawTransactionModule {}
