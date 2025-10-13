import { AuthInfoDto } from './auth/dto/auth-info.dto';

declare module 'nestjs-cls' {
  interface ClsStore {
    authInfo: AuthInfoDto;
  }
}
