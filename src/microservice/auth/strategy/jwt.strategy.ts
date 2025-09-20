import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT } from 'src/shared/constant/auth.constant';
import { AuthInfoDto } from '../dto/auth-info.dto';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT.accessToken.secret,
    });
  }

  validate(payload: any): unknown {
    // return { userId: payload.sub, username: payload.username };
    return payload as AuthInfoDto;
  }
}
