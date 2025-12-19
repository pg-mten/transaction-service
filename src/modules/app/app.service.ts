import { Injectable } from '@nestjs/common';
import { APP_NAME } from 'src/shared/constant/global.constant';

@Injectable()
export class AppService {
  getHello(): string {
    return APP_NAME + ' 01.5';
  }
}
