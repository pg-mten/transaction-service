import { Controller, Get, Inject } from '@nestjs/common';
import { TcpClientOptions, Transport } from '@nestjs/microservices';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  PrismaHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { SERVICES } from '../client.constant';
import { PRISMA_SERVICE } from 'src/modules/prisma/prisma.provider';
import { PublicApi } from '../auth/decorator/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaClient,
  ) {}

  @Get()
  @HealthCheck({ swaggerDocumentation: true })
  @PublicApi()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      async () =>
        this.prismaHealth.pingCheck('prisma', this.prisma, { timeout: 500 }),
      async () =>
        this.microservice.pingCheck<TcpClientOptions>('tcp-auth', {
          transport: Transport.TCP,
          options: {
            host: SERVICES.AUTH.host,
            port: SERVICES.AUTH.port,
          },
        }),
      async () =>
        this.microservice.pingCheck<TcpClientOptions>('tcp-config', {
          transport: Transport.TCP,
          options: {
            host: SERVICES.CONFIG.host,
            port: SERVICES.CONFIG.port,
          },
        }),
      async () =>
        this.microservice.pingCheck<TcpClientOptions>('tcp-transaction', {
          transport: Transport.TCP,
          options: {
            host: SERVICES.TRANSACTION.host,
            port: SERVICES.TRANSACTION.port,
          },
        }),
      async () =>
        this.microservice.pingCheck<TcpClientOptions>('tcp-settlerecon', {
          transport: Transport.TCP,
          options: {
            host: SERVICES.SETTLERECON.host,
            port: SERVICES.SETTLERECON.port,
          },
        }),
    ]);
  }
}
