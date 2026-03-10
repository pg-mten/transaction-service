import { Inject, Injectable } from '@nestjs/common';
import { SERVICES } from '../../shared/constant/client.constant';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { ProfileProviderSystemDto } from './dto-system/profile-provider.system.dto';
import { firstValueFrom } from 'rxjs';
import { FilterProfileProviderSystemDto } from './dto-system/filter-profile-provider.system.dto';
import { DependencyErrorHelper } from 'src/shared/helper';
import { DependencyErrorContext } from 'src/shared/exception';

@Injectable()
export class ProfileProviderConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) { }

  private readonly point = SERVICES.CONFIG.point;

  async findProfileProvider(filter: FilterProfileProviderSystemDto) {
    try {
      const res = await axios.get<ResponseDto<ProfileProviderSystemDto>>(
        this.point.find_profile_provider.url,
        { params: filter },
      );

      return DependencyErrorHelper.ensureData(
        res.data.data,
        DependencyErrorContext.config.providerProfileLookup,
      );
    } catch (error) {
      DependencyErrorHelper.throwFromError(
        error,
        DependencyErrorContext.config.providerProfileLookup,
      );
    }
  }

  async findProfileProviderTCP(filter: FilterProfileProviderSystemDto) {
    return DependencyErrorHelper.withFallback(
      () =>
        firstValueFrom(
        this.configClient.send<ProfileProviderSystemDto>(
          { cmd: this.point.find_profile_provider.cmd },
          filter,
        ),
        ),
      () => this.findProfileProvider(filter),
      DependencyErrorContext.config.providerProfileLookup,
    );
  }
}
