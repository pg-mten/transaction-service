import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE } from 'src/shared/constant/auth.constant';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { Request } from 'express';
import { PUBLIC_API_KEY } from '../decorator/public.decorator';
import { AuthInfoDto } from '../dto/auth-info.dto';
import { SYSTEM_API_KEY } from '../decorator/system.decorator';
import { MERCHANT_API_KEY } from '../decorator/merchant.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
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

    const requiredRoles = this.reflector.getAllAndOverride<ROLE[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;
    const req = context.switchToHttp().getRequest();
    const authInfo: AuthInfoDto = (req as Request).user;
    // const user = await this.userService.findOneByAuthInfoThrow(authInfo);
    // return requiredRoles.some((role) => user.role.name === role.toString());
    // return Object.values(Role).some()
    return requiredRoles.includes(authInfo.role as ROLE);
  }
}
