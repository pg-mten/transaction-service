import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { PRISMA_SERVICE } from 'src/modules/prisma/prisma.provider';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaClient,
  ) {}

  @Get()
  @HealthCheck({ swaggerDocumentation: true })
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      async () =>
        this.prismaHealth.pingCheck('prisma', this.prisma, { timeout: 500 }),
    ]);
  }
}