import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_TRANSACTION } from 'src/shared/constant/client.constant';
import { UpdateWithdrawCallbackSystemDto } from './dto-system/update-withdraw-callback.system.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WithdrawTransacionClient {
  constructor(
    @Inject(SERVICES.TRANSACTION.name)
    private readonly transactionClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.TRANSACTION.cmd;

  /**
   * Mainly for update status based on code and external id
   */
  async callback(body: UpdateWithdrawCallbackSystemDto) {
    try {
      const res = await axios.post<ResponseDto<null>>(
        `${URL_TRANSACTION}/transaction/withdraw/internal/callback`,
        body,
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async callbackTCP(body: UpdateWithdrawCallbackSystemDto) {
    try {
      const res = await firstValueFrom(
        this.transactionClient.send<ResponseDto<null>>(
          { cmd: this.cmd.withdraw_callback },
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
