import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class PrismaUserInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const request = context.switchToHttp().getRequest();
    // const user = request.user;
    // this.prisma.setUserId(user?.id ?? null);
    return next.handle();
  }
}
