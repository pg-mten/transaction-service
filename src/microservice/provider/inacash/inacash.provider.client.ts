import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { InacashCreatePurchaseQrisRequestSystemDto } from './dto-system/inacash-create-purchase-qris.request.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { firstValueFrom } from 'rxjs';
import { InacashWithdrawRequestSystemDto } from './dto-system/inacash-withdraw.request.system.dto';
import { ProviderWithdrawSystemDto } from '../provider-withdraw.system.dto';
import { ProviderPurchaseSystemDto } from '../provider-purchase.system.dto';
import { InacashDisbursementRequestSystemDto } from './dto-system/inacash-disbursement.request.system.dto';
import { ProviderDisbursementSystemDto } from '../provider-disbursement.system.dto';
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';

@Injectable()
export class InacashProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly inacashProviderClient: ClientProxy,
  ) { }

  private readonly point = SERVICES.SETTLERECON.point;

  async purchaseQRIS(body: InacashCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderPurchaseSystemDto>>(
        this.point.inacash_purchase_qris.url,
        body,
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.inacashPurchaseProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.inacashPurchaseProvider,
      );
    }
  }

  async purchaseQRISTCP(body: InacashCreatePurchaseQrisRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.inacashProviderClient.send<ProviderPurchaseSystemDto>(
          { cmd: this.point.inacash_purchase_qris.cmd },
          body,
        ),
        ),
      () => this.purchaseQRIS(body),
      DependencyErrorContext.settlerecon.inacashPurchaseProvider,
    );
  }

  async withdraw(body: InacashWithdrawRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderWithdrawSystemDto>>(
        this.point.inacash_withdraw.url,
        body,
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.inacashWithdrawProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.inacashWithdrawProvider,
      );
    }
  }

  async withdrawTCP(body: InacashWithdrawRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.inacashProviderClient.send<ProviderWithdrawSystemDto>(
          { cmd: this.point.inacash_withdraw.cmd },
          body,
        ),
        ),
      () => this.withdraw(body),
      DependencyErrorContext.settlerecon.inacashWithdrawProvider,
    );
  }

  async disbursement(body: InacashDisbursementRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderDisbursementSystemDto>>(
        this.point.inacash_disbursement.url,
        body,
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.inacashDisbursementProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.inacashDisbursementProvider,
      );
    }
  }

  async disbursementTCP(body: InacashDisbursementRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.inacashProviderClient.send<
          ProviderDisbursementSystemDto
        >({ cmd: this.point.inacash_disbursement.cmd }, body),
        ),
      () => this.disbursement(body),
      DependencyErrorContext.settlerecon.inacashDisbursementProvider,
    );
  }
}
