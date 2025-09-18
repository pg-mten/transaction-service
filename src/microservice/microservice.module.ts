import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { SettlementClient } from './settle-recon/settlement.client';
import { FeeCalculateConfigClient } from './config/fee-calculate.config.client';
import { UserAuthClient } from './auth/user.auth.client';
import { AgentConfigClient } from './config/agent.config.client';
import { MerchantConfigClient } from './config/merchant.config.client';

@Global()
@Module({
  providers: [
    SettlementClient,
    FeeCalculateConfigClient,
    UserAuthClient,
    AgentConfigClient,
    MerchantConfigClient,
    SettlementClient,
  ],
  exports: [
    SettlementClient,
    FeeCalculateConfigClient,
    UserAuthClient,
    AgentConfigClient,
    MerchantConfigClient,
    SettlementClient,
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
