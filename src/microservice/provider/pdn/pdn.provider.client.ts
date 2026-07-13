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
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';

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
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.pdnPurchaseProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.pdnPurchaseProvider,
      );
    }
  }

  async purchaseQRISTCP(body: PdnCreatePurchaseQrisRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
          this.pdnProviderClient.send<ProviderPurchaseSystemDto>(
            { cmd: this.point.pdn_purchase_qris.cmd },
            body,
          ),
        ),
      () => this.purchaseQRIS(body),
      DependencyErrorContext.settlerecon.pdnPurchaseProvider,
    );
  }

  async withdraw(body: PdnWithdrawRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderWithdrawSystemDto>>(
        this.point.pdn_withdraw.url,
        body,
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.pdnWithdrawProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.pdnWithdrawProvider,
      );
    }
  }

  async withdrawTCP(body: PdnWithdrawRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
          this.pdnProviderClient.send<ProviderWithdrawSystemDto>(
            { cmd: this.point.pdn_withdraw.cmd },
            body,
          ),
        ),
      () => this.withdraw(body),
      DependencyErrorContext.settlerecon.pdnWithdrawProvider,
    );
  }

  async disbursement(body: PdnDisbursementRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderDisbursementSystemDto>>(
        this.point.pdn_disbursement.url,
        body,
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.pdnDisbursementProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.pdnDisbursementProvider,
      );
    }
  }

  async disbursementTCP(body: PdnDisbursementRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
          this.pdnProviderClient.send<ProviderDisbursementSystemDto>(
            { cmd: this.point.pdn_disbursement.cmd },
            body,
          ),
        ),
      () => this.disbursement(body),
      DependencyErrorContext.settlerecon.pdnDisbursementProvider,
    );
  }
}
