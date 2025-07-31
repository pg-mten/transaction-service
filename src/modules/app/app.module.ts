import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { LoggerMiddleware } from '../../middlewares/logger.middleware';
import { TransactionsModule } from '../transactions/transactions.module';
import { PrismaService } from '../prisma/prisma.service';
import {
  APP_FILTER,
  APP_INTERCEPTOR,
  APP_PIPE,
  HttpAdapterHost,
  Reflector,
} from '@nestjs/core';
import { CustomValidationPipe } from 'src/pipe/custom-validation.pipe';
import { AllExceptionsFilter } from 'src/filter/all.exceptions.filter';
import { PrismaClientKnownExceptionFilter } from 'src/filter/prisma-client-known.exception.filter';
import { ResponseExceptionFilter } from 'src/filter/response.exception.filter';
import { InvalidRequestExceptionFilter } from 'src/filter/invalid-request.exception.filter';
import { ResponseInterceptor } from 'src/interceptor/response.interceptor';
import { PrismaUserInterceptor } from 'src/interceptor/prisma-user.interceptor';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../logger/logger.module';

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
    TransactionsModule,
    ReconciliationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
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
      inject: [PrismaService],
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
