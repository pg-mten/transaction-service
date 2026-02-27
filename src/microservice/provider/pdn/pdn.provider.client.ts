import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import {
  PdnCreatePurchaseQrisRequestSystemDto,
  PdnDisbursementRequestSystemDto,
  PdnWithdrawRequestSystemDto,
} from './dto-system';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { ProviderPurchaseSystemDto } from '../provider-purchase.system.dto';
import { firstValueFrom } from 'rxjs';
import { ProviderWithdrawSystemDto } from '../provider-withdraw.system.dto';
import { ProviderDisbursementSystemDto } from '../provider-disbursement.system.dto';

@Injectable()
export class PdnProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly pdnProviderClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.SETTLERECON.point;

  async purchaseQRIS(body: PdnCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderPurchaseSystemDto>>(
        this.point.pdn_purchase_qris.url,
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
        this.pdnProviderClient.send<ProviderPurchaseSystemDto>(
          { cmd: this.point.pdn_purchase_qris.cmd },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.purchaseQRIS(body).then((r) => r.data!);
    }
  }

  async withdraw(body: PdnWithdrawRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderWithdrawSystemDto>>(
        this.point.pdn_withdraw.url,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async withdrawTCP(body: PdnWithdrawRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.pdnProviderClient.send<ProviderWithdrawSystemDto>(
          { cmd: this.point.pdn_withdraw.cmd },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.withdraw(body).then((r) => r.data!);
    }
  }

  async disbursement(body: PdnDisbursementRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderDisbursementSystemDto>>(
        this.point.pdn_disbursement.url,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async disbursementTCP(body: PdnDisbursementRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.pdnProviderClient.send<ProviderDisbursementSystemDto>(
          { cmd: this.point.pdn_disbursement.cmd },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.disbursement(body).then((r) => r.data!);
    }
  }
}
