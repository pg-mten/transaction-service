import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { PakaidonkCreatePurchaseQrisRequestSystemDto } from './dto-system';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { ProviderPurchaseSystemDto } from '../provider-purchase.system.dto';
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PakaidonkProviderClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly pakaidonkProviderClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.SETTLERECON.point;

  async purchaseQRIS(body: PakaidonkCreatePurchaseQrisRequestSystemDto) {
    try {
      const res = await axios.post<ResponseDto<ProviderPurchaseSystemDto>>(
        this.point.pakaidonk_purchase_qris.url,
        body,
      );
      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.settlerecon.pakaidonkPurchaseProvider,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.settlerecon.pakaidonkPurchaseProvider,
      );
    }
  }

  async purchaseQRISTCP(body: PakaidonkCreatePurchaseQrisRequestSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
          this.pakaidonkProviderClient.send<ProviderPurchaseSystemDto>(
            { cmd: this.point.pakaidonk_purchase_qris.cmd },
            body,
          ),
        ),
      () => this.purchaseQRIS(body),
      DependencyErrorContext.settlerecon.pakaidonkPurchaseProvider,
    );
  }
}
