import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { Request } from 'express';

export class AuthInfoInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    console.log('AuthInfoInterceptor');
    const request = context.switchToHttp().getRequest();
    const authInfo = (request as Request).user;
    this.cls.set('authInfo', authInfo);
    return next.handle();
  }
}
