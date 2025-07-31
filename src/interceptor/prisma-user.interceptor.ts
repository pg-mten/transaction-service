// src/common/interceptors/prisma-user.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PrismaService } from '../module/prisma/prisma.service';
import { Observable } from 'rxjs';

@Injectable()
export class PrismaUserInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    this.prisma.setUserId(user?.id ?? null);
    return next.handle();
  }
}
