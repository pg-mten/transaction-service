import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { CustomValidationPipe } from 'src/shared/pipe';
import {
  PrismaClientKnownExceptionFilter,
  ResponseExceptionFilter,
  InvalidRequestExceptionFilter,
} from 'src/shared/filter';
import {
  ResponseInterceptor,
  PrismaUserInterceptor,
} from 'src/shared/interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';
import { TopupTransactionModule } from '../topup/topup.module';
import { WithdrawTransactionModule } from '../withdraw/withdraw.module';
import { DisbursementTransactionModule } from '../disbursement/disbursement.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { BalanceModule } from '../balance/balance.module';
import { MicroserviceModule } from 'src/microservice/microservice.module';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    /// System COnfiguration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    PrismaModule,
    LoggerModule,

    /// Business Module
    PurchaseModule,
    TopupTransactionModule,
    WithdrawTransactionModule,
    DisbursementTransactionModule,
    BalanceModule,

    /// Web Client
    MicroserviceModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    /// PIPE
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },

    /// FILTER
    // {
    //   provide: APP_FILTER, // Lowest priority
    //   useFactory: (httpAdapterHost: HttpAdapterHost) => {
    //     return new AllExceptionsFilter(httpAdapterHost);
    //   },
    //   inject: [HttpAdapterHost],
    // },
    {
      provide: APP_FILTER,
      useClass: PrismaClientKnownExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ResponseExceptionFilter,
    },
    {
      provide: APP_FILTER, // Highest priority
      useClass: InvalidRequestExceptionFilter,
    },

    /// INTERCEPTOR
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => {
        return new ClassSerializerInterceptor(reflector);
      },
      inject: [Reflector],
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (prisma: PrismaService) => new PrismaUserInterceptor(prisma),
      inject: [PRISMA_SERVICE],
    },
  ],
})
export class AppModule {}
