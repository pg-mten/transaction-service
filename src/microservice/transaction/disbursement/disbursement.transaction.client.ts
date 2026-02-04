import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_TRANSACTION } from 'src/shared/constant/client.constant';
import { UpdateDisbursementCallbackSystemDto } from './dto-system/update-disbursement-callback.system.dto';
import { ResponseDto } from 'src/shared/response.dto';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DisbursementTransactionClient {
  constructor(
    @Inject(SERVICES.TRANSACTION.name)
    private readonly transactionClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.TRANSACTION.cmd;

  /**
   * Mainly for update status based on code and external id
   */
  async callback(body: UpdateDisbursementCallbackSystemDto) {
    try {
      const res = await axios.post<ResponseDto<null>>(
        `${URL_TRANSACTION}/transaction/disbursement/internal/callback`,
        body,
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async callbackTCP(body: UpdateDisbursementCallbackSystemDto) {
    try {
      const res = await firstValueFrom(
        this.transactionClient.send<ResponseDto<null>>(
          { cmd: this.cmd.disbursement_callback },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.callback(body);
      throw error;
    }
  }
}
