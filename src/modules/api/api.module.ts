import { Module } from '@nestjs/common';
import { Api1Controller } from './v1/api.1.controller';
import { Purchase1Api } from './v1/purchase.1.api';

@Module({
  controllers: [Api1Controller],
  providers: [Purchase1Api],
  exports: [Purchase1Api],
})
export class ApiModule {}
