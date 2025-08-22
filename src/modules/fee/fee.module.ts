import { Module } from '@nestjs/common';
import { FeeCalculateService } from './fee-calculate.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FEE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '0.0.0.0',
          port: 4001,
        },
      },
    ]),
  ],
  providers: [FeeCalculateService],
  exports: [FeeCalculateService],
})
export class FeeModule {}
