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
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      async () =>
        this.prismaHealth.pingCheck('prisma', this.prisma, { timeout: 500 }),
      async () =>
        this.microservice.pingCheck<TcpClientOptions>('tcp', {
          transport: Transport.TCP,
          options: {
            host: SERVICES.APP.host,
            port: SERVICES.APP.port,
          },
        }),
    ]);
  }
}
