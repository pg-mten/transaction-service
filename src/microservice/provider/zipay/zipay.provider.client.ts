import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { ZipayCreatePurchaseQrisRequestSystemDto } from './dto-system';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { ProviderPurchaseSystemDto } from '../provider-purchase.system.dto';
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';
import { firstValueFrom } from 'rxjs';

export class ZipayProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly zipayProviderClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.SETTLERECON.point;

  async purchaseQRIS(body: ZipayCreatePurchaseQrisRequestSystemDto) {
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

  async purchaseQRISTCP(body: ZipayCreatePurchaseQrisRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
          this.zipayProviderClient.send<ProviderPurchaseSystemDto>(
            { cmd: this.point.pdn_purchase_qris.cmd },
            body,
          ),
        ),
      () => this.purchaseQRIS(body),
      DependencyErrorContext.settlerecon.pdnPurchaseProvider,
    );
  }
}
