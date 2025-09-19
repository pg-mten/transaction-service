import { Module } from '@nestjs/common';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BalanceModule } from '../balance/balance.module';

@Module({
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
  imports: [
    BalanceModule,
    ClientsModule.register([
      {
        name: 'SETTLE_RECON_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4004,
        },
      },
    ]),
  ],
})
export class SettlementModule {}
