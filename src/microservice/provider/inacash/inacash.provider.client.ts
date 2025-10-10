import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_SETTLERECON } from 'src/microservice/client.constant';
import { InacashCreatePurchaseQrisRequestSystemDto } from './dto-system/inacash-create-purchase-qris.request.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { firstValueFrom } from 'rxjs';
import { InacashCreatePurchaseQrisResponseSystemDto } from './dto-system/inacash-create-purchase-qris.response.system.dto';

@Injectable()
export class InacashProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly inacashProviderClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.SETTLERECON.cmd;

  async purchaseQRIS(body: InacashCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await axios.post<
        ResponseDto<InacashCreatePurchaseQrisResponseSystemDto>
      >(`${URL_SETTLERECON}/provider/inacash/internal/qris`, body);
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async purchaseQRISTCP(body: InacashCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.inacashProviderClient.send<
          ResponseDto<InacashCreatePurchaseQrisResponseSystemDto>
        >({ cmd: this.cmd.inacash_purchase_qris }, body),
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
