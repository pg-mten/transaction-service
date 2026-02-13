import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { CreatePurchaseCallbackSystemDto } from './dto-system/create-purchase-callback.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PurchaseTransactionClient {
  constructor(
    @Inject(SERVICES.TRANSACTION.name)
    private readonly transactionClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.TRANSACTION.point;

  /**
   * Create Purchase Transaction from Return URL / Callback Provider
   */
  async createCallbackProvider(body: CreatePurchaseCallbackSystemDto) {
    try {
      const res = await axios.post<ResponseDto<null>>(
        this.point.purchase_callback.url,
        body,
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async createCallbackProviderTCP(body: CreatePurchaseCallbackSystemDto) {
    try {
      const res = await firstValueFrom(
        this.transactionClient.send<ResponseDto<null>>(
          {
            cmd: this.point.purchase_callback.cmd,
          },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.createCallbackProvider(body);
      throw error;
    }
  }
}
