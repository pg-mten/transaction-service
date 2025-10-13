// src/common/interceptors/prisma-user.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Observable } from 'rxjs';
import { PRISMA_SERVICE } from 'src/modules/prisma/prisma.provider';

@Injectable()
export class PrismaUserInterceptor implements NestInterceptor {
  constructor(@Inject(PRISMA_SERVICE) private prisma: PrismaClient) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const request = context.switchToHttp().getRequest();
    // const user = request.user;
    // this.prisma.setUserId(user?.id ?? null);
    return next.handle();
  }
}