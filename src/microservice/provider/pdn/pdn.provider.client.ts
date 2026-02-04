import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_SETTLERECON } from 'src/shared/constant/client.constant';
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

  async withdraw(body: PdnWithdrawRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderWithdrawSystemDto>>(
        `${URL_SETTLERECON}/provider/pdn/internal/withdraw`,
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
        this.pdnProviderClient.send<ResponseDto<ProviderWithdrawSystemDto>>(
          { cmd: this.cmd.pdn_withdraw },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.withdraw(body);
      throw error;
    }
  }

  async disbursement(body: PdnDisbursementRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderDisbursementSystemDto>>(
        `${URL_SETTLERECON}/provider/pdn/internal/disbursement`,
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
        this.pdnProviderClient.send<ResponseDto<ProviderDisbursementSystemDto>>(
          { cmd: this.cmd.pdn_disbursement },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.disbursement(body);
      throw error;
    }
  }
}
