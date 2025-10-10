import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ResponseException } from 'src/exception/response.exception';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { AuthInfoDto } from '../dto/auth-info.dto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
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
