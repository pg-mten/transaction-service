import { Inject, Injectable } from '@nestjs/common';
import { SERVICES } from '../../shared/constant/client.constant';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { ProfileProviderSystemDto } from './dto-system/profile-provider.system.dto';
import { firstValueFrom } from 'rxjs';
import { FilterProfileProviderSystemDto } from './dto-system/filter-profile-provider.system.dto';

@Injectable()
export class ProfileProviderConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.CONFIG.point;

  async findProfileProvider(filter: FilterProfileProviderSystemDto) {
    try {
      const res = await axios.get<ResponseDto<ProfileProviderSystemDto>>(
        this.point.find_profile_provider.url,
        { data: filter },
      );

      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findProfileProviderTCP(filter: FilterProfileProviderSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<ProfileProviderSystemDto>>(
          { cmd: this.point.find_profile_provider.cmd },
          filter,
        ),
      );
      return res.data!;
    } catch (error) {
      console.log(error);
      return this.findProfileProvider(filter);
      throw error;
    }
  }
}
