import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_SETTLERECON } from 'src/microservice/client.constant';
import { InacashCreatePurchaseQrisRequestSystemDto } from './dto-system/inacash-create-purchase-qris.request.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { firstValueFrom } from 'rxjs';
import { InacashWithdrawRequestSystemDto } from './dto-system/inacash-withdraw.request.system.dto';
import { ProviderWithdrawSystemDto } from '../provider-withdraw.system.dto';
import { ProviderPurchaseSystemDto } from '../provider-purchase.system.dto';
import { InacashDisbursementRequestSystemDto } from './dto-system/inacash-disbursement.request.system.dto';
import { ProviderDisbursementSystemDto } from '../provider-disbursement.system.dto';

@Injectable()
export class InacashProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly inacashProviderClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.SETTLERECON.cmd;

  async purchaseQRIS(body: InacashCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderPurchaseSystemDto>>(
        `${URL_SETTLERECON}/provider/inacash/internal/qris`,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async purchaseQRISTCP(body: InacashCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.inacashProviderClient.send<ResponseDto<ProviderPurchaseSystemDto>>(
          { cmd: this.cmd.inacash_purchase_qris },
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

  async withdraw(body: InacashWithdrawRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderWithdrawSystemDto>>(
        `${URL_SETTLERECON}/provider/inacash/internal/withdraw`,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async withdrawTCP(body: InacashWithdrawRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.inacashProviderClient.send<ResponseDto<ProviderWithdrawSystemDto>>(
          { cmd: this.cmd.inacash_withdraw },
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

  async disbursement(body: InacashDisbursementRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderDisbursementSystemDto>>(
        `${URL_SETTLERECON}/provider/inacash/internal/disbursement`,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async disbursementTCP(body: InacashDisbursementRequestSystemDto) {
    try {
      const res = await firstValueFrom(
        this.inacashProviderClient.send<
          ResponseDto<ProviderDisbursementSystemDto>
        >({ cmd: this.cmd.inacash_disbursement }, body),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.disbursement(body);
      throw error;
    }
  }
}
