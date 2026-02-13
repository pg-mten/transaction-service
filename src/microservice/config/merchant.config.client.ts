import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
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

  private readonly point = SERVICES.CONFIG.point;

  /**
   * Create Merchant to Config Service
   */
  async create(body: CreateMerchantSystemDto) {
    try {
      const res = await axios.get<ResponseDto<null>>(
        this.point.create_merchant_config.url,
        { data: body },
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async createTCP(body: CreateMerchantSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<null>>(
          { cmd: this.point.create_merchant_config.cmd },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.create(body);
      throw error;
    }
  }
}
