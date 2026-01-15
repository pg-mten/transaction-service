import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES, URL_AUTH } from 'src/microservice/client.constant';
import { ResponseDto } from 'src/shared/response.dto';
import { FilterMerchantsAndAgentsByIdsSystemDto } from './dto-system/filter-merchants-and-agents-by-ids.system.dto';
import axios from 'axios';
import { MerchantsAndAgentsByIdsSystemDto } from './dto-system/merchants-and-agents-by-ids.system.dto';
import { FilterProfileBankSystemDto } from './dto-system/filter-profile-bank.system.dto';
import { ProfileBankByIdSystemDto } from './dto-system/profile-bank.system.dto';

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
      return res.data;
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
      return this.findAllMerchantsAndAgentsByIds(filter);
      throw error;
    }
  }

  async findProfileBank(filter: FilterProfileBankSystemDto) {
    try {
      const res = await axios.get<ResponseDto<ProfileBankByIdSystemDto>>(
        `${URL_AUTH}/user/internal/profile-bank`,
        {
          params: filter,
        },
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findProfileBankTCP(filter: FilterProfileBankSystemDto) {
    try {
      const res = await firstValueFrom(
        this.authClient.send<ResponseDto<ProfileBankByIdSystemDto>>(
          { cmd: this.cmd.find_profile_bank },
          filter,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.findProfileBank(filter);
      throw error;
    }
  }
}
