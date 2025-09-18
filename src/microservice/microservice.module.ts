import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { SettlementSettleReconClient } from './settlerecon/settlement.settlerecon.client';
import { FeeCalculateConfigClient } from './config/fee-calculate.config.client';
import { UserAuthClient } from './auth/user.auth.client';
import { AgentConfigClient } from './config/agent.config.client';
import { MerchantConfigClient } from './config/merchant.config.client';

@Global()
@Module({
  providers: [
    SettlementSettleReconClient,
    FeeCalculateConfigClient,
    UserAuthClient,
    AgentConfigClient,
    MerchantConfigClient,
    SettlementSettleReconClient,
  ],
  exports: [
    SettlementSettleReconClient,
    FeeCalculateConfigClient,
    UserAuthClient,
    AgentConfigClient,
    MerchantConfigClient,
    SettlementSettleReconClient,
  ],
  imports: [
    /// Register Client
    ClientsModule.register([
      {
        name: SERVICES.AUTH.name,
        transport: Transport.TCP,
        options: {
          host: SERVICES.AUTH.host,
          port: SERVICES.AUTH.port,
        },
      },
    ]),
    ClientsModule.register([
      {
        name: SERVICES.CONFIG.name,
        transport: Transport.TCP,
        options: {
          host: SERVICES.CONFIG.host,
          port: SERVICES.CONFIG.port,
        },
      },
    ]),
    ClientsModule.register([
      {
        name: SERVICES.TRANSACTION.name,
        transport: Transport.TCP,
        options: {
          host: SERVICES.TRANSACTION.host,
          port: SERVICES.TRANSACTION.port,
        },
      },
    ]),
    ClientsModule.register([
      {
        name: SERVICES.SETTLERECON.name,
        transport: Transport.TCP,
        options: {
          host: SERVICES.SETTLERECON.host,
          port: SERVICES.SETTLERECON.port,
        },
      },
    ]),
  ],
})
export class MicroserviceModule {}
