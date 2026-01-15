import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from 'src/microservice/client.constant';
import { SettlementSettleReconClient } from './settlerecon/settlement.settlerecon.client';
import { FeeCalculateConfigClient } from './config/fee-calculate.config.client';
import { UserAuthClient } from './auth/user.auth.client';
import { AgentConfigClient } from './config/agent.config.client';
import { MerchantConfigClient } from './config/merchant.config.client';
import { JwtModule } from '@nestjs/jwt';
import { JWT } from 'src/microservice/auth.constant';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { MerchantSignatureAuthClient } from './auth/merchant-signature.auth.client';
import { HealthModule } from './health/health.module';
// import { ClsModule, ClsService } from 'nestjs-cls';
import { AuthInfoInterceptor } from 'src/interceptor/auth-info.interceptor';
import { PurchaseTransactionClient } from './transaction/purchase/purchase.transaction.client';
import { InacashProviderClient } from './provider/inacash/inacash.provider.client';
import { WithdrawTransacionClient } from './transaction/withdraw/withdraw.transaction.client';
import { DisbursementTransactionClient } from './transaction/disbursement/disbursement.transaction.client';
import { PdnProviderClient } from './provider/pdn/pdn.provider.client';
import { ProfileProviderConfigClient } from './config/profile-provider.config.client';

@Global()
@Module({
  exports: [
    FeeCalculateConfigClient,
    UserAuthClient,
    AgentConfigClient,
    MerchantConfigClient,
    SettlementSettleReconClient,
    MerchantSignatureAuthClient,
    PurchaseTransactionClient,
    WithdrawTransacionClient,
    DisbursementTransactionClient,
    InacashProviderClient,
    PdnProviderClient,
    ProfileProviderConfigClient,
  ],
  providers: [
    /// Register Client
    FeeCalculateConfigClient,
    UserAuthClient,
    AgentConfigClient,
    MerchantConfigClient,
    SettlementSettleReconClient,
    MerchantSignatureAuthClient,
    PurchaseTransactionClient,
    WithdrawTransacionClient,
    DisbursementTransactionClient,
    InacashProviderClient,
    PdnProviderClient,
    ProfileProviderConfigClient,

    /// TODO Non aktifkan dulu bolooo
    // JwtStrategy,
    /// Guard
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useFactory: (clsService: ClsService) =>
    //     new AuthInfoInterceptor(clsService),
    //   inject: [ClsService],
    // },
  ],

  imports: [
    HealthModule,

    /// JWT Authentication
    JwtModule.register({
      secret: JWT.accessToken.secret,
      signOptions: { expiresIn: JWT.accessToken.expireIn },
    }),

    // ClsModule.forRoot({
    //   global: true,
    //   middleware: {
    //     mount: true,
    //   },
    // }),

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
