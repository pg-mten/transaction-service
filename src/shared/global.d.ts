import { AuthInfoDto } from 'src/module/auth/dto/auth.dto';

declare module 'express-serve-static-core' {
  interface Request {
    user: AuthInfoDto;
  }
}

export {};
