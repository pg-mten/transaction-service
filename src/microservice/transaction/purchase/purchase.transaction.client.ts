import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_TRANSACTION } from 'src/shared/constant/client.constant';
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

  private readonly cmd = SERVICES.TRANSACTION.cmd;

  /**
   * Create Purchase Transaction from Return URL / Callback Provider
   */
  async createCallbackProvider(body: CreatePurchaseCallbackSystemDto) {
    try {
      const res = await axios.post<ResponseDto<null>>(
        `${URL_TRANSACTION}/transaction/purchase/internal/callback`,
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
            cmd: this.cmd.purchase_callback,
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
