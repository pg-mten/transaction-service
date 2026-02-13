import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
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

  private readonly point = SERVICES.SETTLERECON.point;

  async schedule(body: CreateSettlementScheduleSystemDto) {
    try {
      const res = await axios.post<ResponseDto<SettlementScheduleSystemDto>>(
        this.point.settlement_schedule.url,
        body,
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async scheduleTCP(body: CreateSettlementScheduleSystemDto) {
    try {
      const res = await firstValueFrom(
        this.settleReconClient.send<ResponseDto<SettlementScheduleSystemDto>>(
          { cmd: this.point.settlement_schedule.cmd },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.schedule(body);
      throw error;
    }
  }
}
