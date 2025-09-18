import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, URL_AUTH } from 'src/shared/constant/client.constant';
import { ResponseDto } from 'src/shared/response.dto';
import { FilterMerchantsAndAgentsByIdsSystemDto } from './dto-system/filter-merchants-and-agents-by-ids.system.dto';
import axios from 'axios';
import { MerchantsAndAgentsByIdsSystemDto } from './dto-system/merchants-and-agents-by-ids.system.dto';

@Injectable()
export class UserAuthClient {
  constructor(
    @Inject(SERVICES.AUTH.name)
    private readonly authClient: ClientProxy,
  ) {}

  private readonly cmd = SERVICES.AUTH.cmd;

  async findAllMerchantsAndAgentsByIds(
    filter: FilterMerchantsAndAgentsByIdsSystemDto,
  ) {
    try {
      const res = await axios.get<
        ResponseDto<MerchantsAndAgentsByIdsSystemDto>
      >(`${URL_AUTH}/user/internal/merchants-and-agents-by-ids`, {
        params: filter,
      });
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllMerchantsAndAgentsByIdsTCP(
    filter: FilterMerchantsAndAgentsByIdsSystemDto,
  ) {
    try {
      const res = await firstValueFrom(
        this.authClient.send<ResponseDto<MerchantsAndAgentsByIdsSystemDto>>(
          { cmd: this.cmd.find_all_merchants_and_agents_by_ids },
          filter,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
