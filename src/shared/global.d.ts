import { ModuleRef } from '@nestjs/core';
import { AuthInfoDto } from 'src/module/auth/dto/auth.dto';

declare global {
  var __moduleRef__: ModuleRef | undefined;
}

declare module 'express-serve-static-core' {
  interface Request {
    user: AuthInfoDto;
  }
}

export {};
