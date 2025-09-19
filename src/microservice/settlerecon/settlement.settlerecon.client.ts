import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_SETTLERECON } from 'src/shared/constant/client.constant';
import { CreateSettlementScheduleSystemDto } from './dto-system/create-settlement-schedule.system.dto';
import { firstValueFrom } from 'rxjs';
import { ResponseDto } from 'src/shared/response.dto';
import { SettlementScheduleSystemDto } from './dto-system/settlement-schedule.system';
import axios from 'axios';

@Injectable()
export class SettlementSettleReconClient {
  constructor(
    @Inject(SERVICES.SETTLERECON.name)
    private readonly settleReconClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.SETTLERECON.cmd;

  async schedule(body: CreateSettlementScheduleSystemDto) {
    try {
      const res = await axios.post<ResponseDto<SettlementScheduleSystemDto>>(
        `${URL_SETTLERECON}/settlement/internal`,
        body,
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async scheduleTCP(body: CreateSettlementScheduleSystemDto) {
    try {
      const res = await firstValueFrom(
        this.settleReconClient.send<ResponseDto<SettlementScheduleSystemDto>>(
          { cmd: this.cmd.settlement_schedule },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
