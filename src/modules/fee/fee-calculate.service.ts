import { Inject, Injectable } from '@nestjs/common';
import { FilterPurchasingFeeDto } from './dto/filter-purchasing-fee.dto';
import axios from 'axios';
import { ResponseDto } from 'src/shared/response.dto';
import { PurchasingFeeDto } from './dto/purchashing-fee.dto';
import { URL_CONFIG } from 'src/shared/constant/url.constant';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FeeCalculateService {
  constructor(@Inject('FEE_SERVICE') private readonly feeClient: ClientProxy) {}

  async calculateFeeConfig(filter: FilterPurchasingFeeDto) {
    try {
      const res = await axios.get<ResponseDto<PurchasingFeeDto>>(
        `${URL_CONFIG}/fee/internal/purchasing`,
        {
          params: filter,
        },
      );
      return res.data.data!;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async calculateFeeConfigTCP(filter: FilterPurchasingFeeDto) {
    try {
      const res = await firstValueFrom(
        this.feeClient.send<ResponseDto<PurchasingFeeDto>>(
          { cmd: 'calculate_fee_purchase' },
          filter,
        ),
      );
      return res;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
