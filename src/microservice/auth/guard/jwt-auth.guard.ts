import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ResponseException } from 'src/exception/response.exception';
import { PUBLIC_API_KEY } from '../decorator/public.decorator';
import { AuthInfoDto } from '../dto/auth-info.dto';
import { SYSTEM_API_KEY } from '../decorator/system.decorator';
import { MERCHANT_API_KEY } from '../decorator/merchant.decorator';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    /// TODO: Temporary, Prometheus, Buatkan MetricsController dan pasang Decorator @SystemApi()
    if (req.path === '/metrics') return true;

    const isPublicApi = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_API_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isSystemApi = this.reflector.getAllAndOverride<boolean>(
      SYSTEM_API_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isMerchantApi = this.reflector.getAllAndOverride<boolean>(
      MERCHANT_API_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublicApi || isSystemApi || isMerchantApi) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser extends AuthInfoDto>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    console.log('JwtAuthGuard');
    console.log({ err, user, info, context, status });
    /// TODO Sampai semua backend apps sudah implement JWT, di uncomment dulu
    if (err || !user) {
      throw ResponseException.fromHttpExecption(new UnauthorizedException());
    }

    return user;
  }
}
