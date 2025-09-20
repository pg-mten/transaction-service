import { AuthInfoDto } from 'src/microservice/auth/dto/auth-info.dto';

declare module 'express-serve-static-core' {
  interface Request {
    authInfo: AuthInfoDto;
  }
}
