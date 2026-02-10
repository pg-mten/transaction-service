import { Module } from '@nestjs/common';
import { Api1Controller } from './v1/api.1.controller';
import { Purchase1Api } from './v1/purchase.1.api';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [Api1Controller],
  providers: [Purchase1Api],
  exports: [Purchase1Api],
  imports: [BalanceModule],
})
export class ApiModule {}
