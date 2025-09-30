import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_CONFIG } from 'src/microservice/client.constant';
import { CreateMerchantSystemDto } from './dto-system/create-merchant.system.dto';
import { firstValueFrom } from 'rxjs';
import { ResponseDto } from 'src/shared/response.dto';
import axios from 'axios';

@Injectable()
export class MerchantConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.CONFIG.cmd;

  /**
   * Create Merchant to Config Service
   */
  async create(body: CreateMerchantSystemDto) {
    try {
      const res = await axios.get<ResponseDto<null>>(
        `${URL_CONFIG}/merchant/internal`,
        { data: body },
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async createTCP(body: CreateMerchantSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<null>>(
          { cmd: this.cmd.create_merchant_config },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
