import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_SETTLERECON } from 'src/microservice/client.constant';
import { PdnCreatePurchaseQrisRequestSystemDto } from './dto-system';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { ProviderPurchaseSystemDto } from '../provider-purchase.system.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PdnProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly pdnProviderClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.SETTLERECON.cmd;

  async purchaseQRIS(body: PdnCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderPurchaseSystemDto>>(
        `${URL_SETTLERECON}/provider/pdn/internal/qris`,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async purchaseQRISTCP(body: PdnCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.pdnProviderClient.send<ResponseDto<ProviderPurchaseSystemDto>>(
          { cmd: this.cmd.pdn_purchase_qris },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.purchaseQRIS(body);
      throw error;
    }
  }
}
